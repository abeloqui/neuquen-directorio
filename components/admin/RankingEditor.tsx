"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RankingRow, RankingSettings } from "@/lib/types";

const FIELDS: { key: keyof Omit<RankingSettings, "id">; label: string }[] = [
  { key: "weight_infra_open", label: "Puntos por problema de infraestructura abierto" },
  { key: "weight_security", label: "Puntos por reporte de seguridad reciente" },
  { key: "weight_resolution_days", label: "Puntos por día promedio de resolución" },
  { key: "resolution_days_cap", label: "Tope de días de resolución" },
  { key: "weight_resolved_bonus", label: "Puntos que resta cada resuelto reciente" },
  { key: "window_days", label: "Ventana de “reciente” (días)" },
];

function SettingsForm({ settings }: { settings: RankingSettings }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, String(settings[f.key])]))
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const payload: Record<string, number | string> = { updated_at: new Date().toISOString() };
    for (const f of FIELDS) {
      const n = Number(values[f.key]);
      if (!Number.isFinite(n) || n < 0) {
        setMsg(`Valor inválido en: ${f.label}`);
        setSaving(false);
        return;
      }
      payload[f.key] = f.key === "window_days" ? Math.round(n) : n;
    }
    const { error } = await createClient().from("ranking_settings").update(payload).eq("id", 1);
    setSaving(false);
    if (error) setMsg(error.message);
    else {
      setMsg("Pesos guardados. El ranking se recalculó.");
      router.refresh();
    }
  }

  return (
    <section className="card">
      <h2 className="font-semibold">Pesos de la fórmula (públicos)</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input
              type="number"
              step="any"
              min="0"
              className="input"
              value={values[f.key]}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar pesos"}
        </button>
        {msg && <span className="text-xs text-gray-600 dark:text-gray-400">{msg}</span>}
      </div>
    </section>
  );
}

function HoodRow({ row }: { row: RankingRow }) {
  const router = useRouter();
  const [adj, setAdj] = useState(String(row.manual_adjustment));
  const [note, setNote] = useState(row.adjustment_note ?? "");
  const [saving, setSaving] = useState(false);

  const dirty =
    Number(adj) !== Number(row.manual_adjustment) || note !== (row.adjustment_note ?? "");

  async function save() {
    const n = Number(adj);
    if (!Number.isFinite(n)) {
      alert("El ajuste debe ser un número.");
      return;
    }
    setSaving(true);
    const { error } = await createClient()
      .from("neighborhoods")
      .update({ manual_adjustment: n, adjustment_note: note.trim() || null })
      .eq("id", row.id);
    setSaving(false);
    if (error) alert(error.message);
    else router.refresh();
  }

  return (
    <li className="card !p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
          #{Number(row.position)} {row.name}
        </p>
        <span className="text-sm font-bold tabular-nums">{Number(row.score).toFixed(1)}</span>
      </div>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        Infra abierta: {row.infra_open} · Seguridad: {row.security_recent} · Resueltos:{" "}
        {row.resolved_recent} · Días prom.: {Number(row.avg_resolution_days)}
      </p>
      <div className="mt-2 grid grid-cols-[6rem_1fr_auto] gap-2">
        <input
          type="number"
          step="any"
          className="input !py-1.5"
          value={adj}
          onChange={(e) => setAdj(e.target.value)}
          aria-label="Ajuste manual"
        />
        <input
          className="input !py-1.5"
          placeholder="Motivo del ajuste (se muestra público)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="btn btn-secondary btn-sm" disabled={!dirty || saving} onClick={save}>
          {saving ? "…" : "Guardar"}
        </button>
      </div>
    </li>
  );
}

export default function RankingEditor({
  settings,
  rows,
}: {
  settings: RankingSettings;
  rows: RankingRow[];
}) {
  return (
    <div className="space-y-5">
      <SettingsForm settings={settings} />
      <section>
        <h2 className="mb-1 font-semibold">Ajuste manual por barrio</h2>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Un valor positivo suma puntos (más problemas); uno negativo resta. Si el ajuste es
          distinto de 0, se muestra públicamente con su motivo.
        </p>
        <ul className="space-y-2">
          {rows.map((r) => (
            <HoodRow key={`${r.id}-${r.manual_adjustment}-${r.adjustment_note}`} row={r} />
          ))}
        </ul>
      </section>
    </div>
  );
}
