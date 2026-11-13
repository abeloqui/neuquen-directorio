"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ALL_STATUSES,
  PHOTO_BUCKET,
  STATUS_COLORS,
  STATUS_LABELS,
  TYPE_COLORS,
  TYPE_LABELS,
  categoryEmoji,
  categoryLabel,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { AdminReport, ReportStatus } from "@/lib/types";
import { formatDate, photoPathFromUrl } from "@/lib/utils";

export default function ReportTable({ reports }: { reports: AdminReport[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(id: string, values: Record<string, unknown>) {
    setBusy(id);
    const { error } = await createClient().from("reports").update(values).eq("id", id);
    setBusy(null);
    if (error) alert(error.message);
    else router.refresh();
  }

  async function reject(id: string) {
    const reason = window.prompt("Motivo del rechazo (opcional):");
    if (reason === null) return;
    await patch(id, { status: "rejected", rejection_reason: reason.trim() || null });
  }

  async function remove(r: AdminReport) {
    if (!window.confirm(`¿Eliminar definitivamente "${r.title}"?`)) return;
    setBusy(r.id);
    const supabase = createClient();
    const { error } = await supabase.from("reports").delete().eq("id", r.id);
    if (!error) {
      const path = photoPathFromUrl(r.photo_url);
      if (path) await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    }
    setBusy(null);
    if (error) alert(error.message);
    else router.refresh();
  }

  if (reports.length === 0) {
    return <p className="text-sm text-gray-500">No hay reportes en esta categoría.</p>;
  }

  return (
    <ul className="space-y-3">
      {reports.map((r) => (
        <li key={r.id} className="card">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="badge text-white" style={{ backgroundColor: TYPE_COLORS[r.type] }}>
              {TYPE_LABELS[r.type]}
            </span>
            <span className="badge bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              {categoryEmoji(r.category)} {categoryLabel(r.category)}
            </span>
            <span className={`badge ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
            {r.featured && (
              <span className="badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                ⭐ Destacado
              </span>
            )}
          </div>

          <div className="mt-2 flex gap-3">
            {r.photo_url && (
              <img src={r.photo_url} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">{r.title}</h3>
              <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                {r.description}
              </p>
            </div>
          </div>

          <dl className="mt-2 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
            <div>📅 {formatDate(r.created_at)}</div>
            <div>🏘️ {r.neighborhood_name ?? "Sin barrio"}</div>
            <div>👤 {r.author_name ?? "Anónimo"}</div>
            <div>
              📞 Contacto: <strong>{r.contact ?? "no dejó"}</strong>
            </div>
            <div>
              🗺️{" "}
              <a
                className="text-brand-600 underline"
                target="_blank"
                rel="noreferrer"
                href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}#map=18/${r.lat}/${r.lng}`}
              >
                Ver ubicación
              </a>
            </div>
            {r.status === "rejected" && r.rejection_reason && (
              <div>🚫 Motivo: {r.rejection_reason}</div>
            )}
          </dl>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {r.status === "pending" && (
              <>
                <button
                  className="btn btn-success btn-sm"
                  disabled={busy === r.id}
                  onClick={() => patch(r.id, { status: "approved", rejection_reason: null })}
                >
                  ✓ Aprobar
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={busy === r.id}
                  onClick={() => reject(r.id)}
                >
                  ✕ Rechazar
                </button>
              </>
            )}
            <select
              className="input !w-auto !py-1.5 text-xs"
              value={r.status}
              disabled={busy === r.id}
              onChange={(e) => patch(r.id, { status: e.target.value as ReportStatus })}
              aria-label="Cambiar estado"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button
              className="btn btn-secondary btn-sm"
              disabled={busy === r.id}
              onClick={() => patch(r.id, { featured: !r.featured })}
            >
              {r.featured ? "★ Quitar destacado" : "☆ Destacar"}
            </button>
            <Link href={`/admin/reportes/${r.id}`} className="btn btn-secondary btn-sm">
              ✏️ Editar
            </Link>
            <button
              className="btn btn-danger btn-sm ml-auto"
              disabled={busy === r.id}
              onClick={() => remove(r)}
            >
              🗑️
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
