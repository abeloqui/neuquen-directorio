import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ALLOWED_PHOTO_TYPES,
  CATEGORIES,
  LAT_MAX,
  LAT_MIN,
  LNG_MAX,
  LNG_MIN,
  MAX_PHOTO_BYTES,
  PHOTO_BUCKET,
} from "@/lib/constants";

export const runtime = "nodejs";

// Rate limit simple en memoria (por instancia). Suficiente como primera barrera.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function tooManyRequests(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function str(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const form = await request.formData();

    // Honeypot: los bots completan este campo
    if (str(form.get("website"))) {
      return NextResponse.json({ ok: true });
    }

    if (tooManyRequests(ip)) {
      return NextResponse.json(
        { error: "Enviaste muchos reportes seguidos. Probá de nuevo más tarde." },
        { status: 429 }
      );
    }

    const type = str(form.get("type"));
    const category = str(form.get("category"));
    const title = str(form.get("title"));
    const description = str(form.get("description"));
    const lat = Number(str(form.get("lat")));
    const lng = Number(str(form.get("lng")));
    const hoodRaw = str(form.get("neighborhood_id"));
    const author = str(form.get("author_name")).slice(0, 60);
    const contact = str(form.get("contact")).slice(0, 120);

    if (type !== "infraestructura" && type !== "seguridad") {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }
    if (!CATEGORIES.some((c) => c.slug === category && c.type === type)) {
      return NextResponse.json({ error: "Categoría inválida." }, { status: 400 });
    }
    if (title.length < 5 || title.length > 120) {
      return NextResponse.json(
        { error: "El título debe tener entre 5 y 120 caracteres." },
        { status: 400 }
      );
    }
    if (description.length < 10 || description.length > 2000) {
      return NextResponse.json(
        { error: "La descripción debe tener entre 10 y 2000 caracteres." },
        { status: 400 }
      );
    }
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < LAT_MIN ||
      lat > LAT_MAX ||
      lng < LNG_MIN ||
      lng > LNG_MAX
    ) {
      return NextResponse.json(
        { error: "La ubicación debe estar dentro de Neuquén Capital." },
        { status: 400 }
      );
    }

    let neighborhoodId: number | null = null;
    if (hoodRaw) {
      const n = Number(hoodRaw);
      if (!Number.isInteger(n) || n <= 0) {
        return NextResponse.json({ error: "Barrio inválido." }, { status: 400 });
      }
      neighborhoodId = n;
    }

    const supabase = createAdminClient();

    // Foto opcional
    let photoUrl: string | null = null;
    const photo = form.get("photo");
    if (photo instanceof File && photo.size > 0) {
      if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
        return NextResponse.json(
          { error: "La foto debe ser JPG, PNG o WebP." },
          { status: 400 }
        );
      }
      if (photo.size > MAX_PHOTO_BYTES) {
        return NextResponse.json(
          { error: "La foto es demasiado pesada (máximo 4 MB)." },
          { status: 400 }
        );
      }
      const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const buffer = Buffer.from(await photo.arrayBuffer());
      const { error: upErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, buffer, { contentType: photo.type, upsert: false });
      if (upErr) {
        return NextResponse.json(
          { error: "No pudimos subir la foto. Probá sin foto o más tarde." },
          { status: 500 }
        );
      }
      photoUrl = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from("reports").insert({
      type,
      category,
      title,
      description,
      photo_url: photoUrl,
      lat,
      lng,
      neighborhood_id: neighborhoodId,
      author_name: author || null,
      contact: contact || null,
      status: "pending",
      featured: false,
    });

    if (error) {
      return NextResponse.json(
        { error: "No pudimos guardar el reporte. Probá de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}
