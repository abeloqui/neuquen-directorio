"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ALL_STATUSES,
  PHOTO_BUCKET,
  STATUS_LABELS,
  TYPE_LABELS,
  categoriesFor,
} from "@/lib/constants";
import { compressImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import type { NeighborhoodOption, Report, ReportStatus, ReportType } from "@/lib/types";
import { photoPathFromUrl } from "@/lib/utils";
import type { LatLng } from "@/components/map/LocationPicker";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-72 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
  ),
});

interface Props {
  mode: "new" | "edit";
  neighborhoods: NeighborhoodOption[];
  report?: Report;
}

export default function ReportEditForm({ mode, neighborhoods, report }: Props) {
  const router = useRouter();
  const initialType: ReportType = report?.type ?? "infraestructura";

  const [type, setType] = useState<ReportType>(initialType);
  const [category, setCategory] = useState(report?.category ?? categoriesFor(initialType)[0].slug);
  const [title, setTitle] = useState(report?.title ?? "");
  const [description, setDescription] = useState(report?.description ?? "");
  const [status, setStatus] = useState<ReportStatus>(report?.status ?? "approved");
  const [featured, setFeatured] = useState(report?.featured ?? false);
  const [hood, setHood] = useState(report?.neighborhood_id ? String(report.neighborhood_id) : "");
  const [author, setAuthor] = useState(report?.author_name ?? "");
  const [contact, setContact] = useState(report?.contact ?? "");
  const [rejection, setRejection] = useState(report?.rejection_reason ?? "");
  const [pos, setPos] = useState<LatLng | null>(
    report ? { lat: report.lat, lng: report.lng } : null
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(report?.photo_url ?? null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!newPhoto) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(newPhoto);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [newPhoto]);

  function changeType(t: ReportType) {
    setType(t);
    if (!categoriesFor(t).some((c) => c.slug === category)) {
      setCategory(categoriesFor(t)[0].slug);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pos) {
      setError("Marcá la ubicación en el mapa.");
      return;
    }
    setSaving(true);
    const supabase = createClient();

    try {
      let finalPhoto = photoUrl;
      const oldPhoto = report?.photo_url ?? null;

      if (newPhoto) {
        const file = await compressImage(newPhoto);
        const path = `${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, file, { contentType: file.type || "image/jpeg" });
        if (upErr) throw new Error(upErr.message);
        finalPhoto = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
      }

      const payload = {
        type,
        category,
        title: title.trim(),
        description: description.trim(),
        photo_url: finalPhoto,
        lat: pos.lat,
        lng: pos.lng,
        neighborhood_id: hood ? Number(hood) : null,
        author_name: author.trim() || null,
        contact: contact.trim() || null,
        status,
        featured,
        rejection_reason: status === "rejected" ? rejection.trim() || null : null,
      };

      const { error: dbErr } =
        mode === "new"
          ? await supabase.from("reports").insert(payload)
          : await supabase.from("reports").update(payload).eq("id", report!.id);
      if (dbErr) throw new Error(dbErr.message);

      if (oldPhoto && oldPhoto !== finalPhoto) {
        const oldPath = photoPathFromUrl(oldPhoto);
        if (oldPath) await supabase.storage.from(PHOTO_BUCKET).remove([oldPath]);
      }

      router.push("/admin/reportes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="type">Tipo</label>
          <select
            id="type"
            className="input"
            value={type}
            onChange={(e) => changeType(e.target.value as ReportType)}
          >
            {(Object.keys(TYPE_LABELS) as ReportType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="category">Categoría</label>
          <select
            id="category"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categoriesFor(type).map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="title">Título</label>
        <input
          id="title"
          className="input"
          required
          minLength={5}
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="description">Descripción</label>
        <textarea
          id="description"
          className="input min-h-32"
          required
          minLength={10}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="status">Estado</label>
          <select
            id="status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReportStatus)}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="hood">Barrio</label>
          <select
            id="hood"
            className="input"
            value={hood}
            onChange={(e) => setHood(e.target.value)}
          >
            <option value="">Sin barrio</option>
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === "rejected" && (
        <div>
          <label className="label" htmlFor="rejection">Motivo del rechazo</label>
          <input
            id="rejection"
            className="input"
            value={rejection}
            onChange={(e) => setRejection(e.target.value)}
          />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="h-4 w-4"
        />
        ⭐ Destacar este reporte en el mapa
      </label>

      <div>
        <span className="label">Ubicación (tocá el mapa o arrastrá el pin para moverla)</span>
        <LocationPicker value={pos} onChange={setPos} />
      </div>

      <div>
        <span className="label">Foto</span>
        {(preview ?? photoUrl) && (
          <img
            src={(preview ?? photoUrl) as string}
            alt="Foto del reporte"
            className="mb-2 max-h-48 rounded-lg"
          />
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setNewPhoto(e.target.files?.[0] ?? null)}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        {photoUrl && !newPhoto && (
          <button
            type="button"
            onClick={() => setPhotoUrl(null)}
            className="mt-1 text-xs text-red-600 underline"
          >
            Quitar foto actual
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="author">Nombre o apodo</label>
          <input
            id="author"
            className="input"
            maxLength={60}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="contact">Contacto (solo admin)</label>
          <input
            id="contact"
            className="input"
            maxLength={120}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn btn-primary flex-1">
          {saving ? "Guardando…" : mode === "new" ? "Crear reporte" : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/reportes")}
          className="btn btn-secondary"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
