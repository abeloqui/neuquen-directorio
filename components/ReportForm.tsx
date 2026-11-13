"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { TYPE_LABELS, categoriesFor } from "@/lib/constants";
import { compressImage } from "@/lib/image";
import type { NeighborhoodOption, ReportType } from "@/lib/types";
import type { LatLng } from "./map/LocationPicker";

const LocationPicker = dynamic(() => import("./map/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-72 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
  ),
});

export default function ReportForm({
  neighborhoods,
}: {
  neighborhoods: NeighborhoodOption[];
}) {
  const [type, setType] = useState<ReportType>("infraestructura");
  const [category, setCategory] = useState(categoriesFor("infraestructura")[0].slug);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pos, setPos] = useState<LatLng | null>(null);
  const [hood, setHood] = useState("");
  const [author, setAuthor] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!photo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function changeType(t: ReportType) {
    setType(t);
    setCategory(categoriesFor(t)[0].slug);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pos) {
      setError("Marcá la ubicación en el mapa o usá tu ubicación actual.");
      return;
    }
    setState("sending");
    try {
      const fd = new FormData();
      fd.set("type", type);
      fd.set("category", category);
      fd.set("title", title.trim());
      fd.set("description", description.trim());
      fd.set("lat", String(pos.lat));
      fd.set("lng", String(pos.lng));
      fd.set("neighborhood_id", hood);
      fd.set("author_name", author.trim());
      fd.set("contact", contact.trim());
      fd.set("website", website);
      if (photo) fd.set("photo", await compressImage(photo));

      const res = await fetch("/api/reports", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No pudimos enviar el reporte.");
      setState("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="card text-center">
        <div className="text-5xl">✅</div>
        <h2 className="mt-3 text-xl font-bold">¡Gracias por reportar!</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Tu reporte quedó en estado <strong>Pendiente</strong>. Una persona
          administradora lo va a revisar antes de publicarlo en el mapa.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/mapa" className="btn btn-primary">
            Ver el mapa
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setTitle("");
              setDescription("");
              setPhoto(null);
              setPos(null);
              setState("idle");
            }}
          >
            Hacer otro reporte
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <span className="label">Tipo de reporte</span>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(TYPE_LABELS) as ReportType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => changeType(t)}
              className={`rounded-lg border px-3 py-3 text-sm font-semibold ${
                type === t
                  ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-100"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            >
              {t === "infraestructura" ? "🔧" : "🚨"} {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
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
          placeholder="Ej: Bache profundo en la esquina"
        />
      </div>

      <div>
        <label className="label" htmlFor="description">Descripción</label>
        <textarea
          id="description"
          className="input min-h-28"
          required
          minLength={10}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contá qué pasa, desde cuándo y qué riesgo genera."
        />
      </div>

      <div>
        <label className="label" htmlFor="photo">Foto (opcional)</label>
        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        {preview && (
          <div className="mt-2">
            <img src={preview} alt="Vista previa" className="max-h-48 rounded-lg" />
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="mt-1 text-xs text-red-600 underline"
            >
              Quitar foto
            </button>
          </div>
        )}
      </div>

      <div>
        <span className="label">Ubicación</span>
        <LocationPicker value={pos} onChange={setPos} />
      </div>

      <div>
        <label className="label" htmlFor="hood">Barrio (opcional)</label>
        <select
          id="hood"
          className="input"
          value={hood}
          onChange={(e) => setHood(e.target.value)}
        >
          <option value="">No sé / no aplica</option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="author">Nombre o apodo (opcional)</label>
          <input
            id="author"
            className="input"
            maxLength={60}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="contact">Email o WhatsApp (opcional)</label>
          <input
            id="contact"
            className="input"
            maxLength={120}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Solo lo ve el administrador"
          />
        </div>
      </div>

      {/* Honeypot anti-spam: oculto para personas */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Sitio web
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}

      <button type="submit" disabled={state === "sending"} className="btn btn-primary w-full">
        {state === "sending" ? "Enviando…" : "Enviar reporte"}
      </button>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Tu reporte se revisa antes de publicarse. Para emergencias llamá al 911.
      </p>
    </form>
  );
}
