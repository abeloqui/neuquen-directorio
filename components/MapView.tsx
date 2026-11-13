"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { CATEGORIES, TYPE_LABELS } from "@/lib/constants";
import type { NeighborhoodOption, PublicReport, ReportType } from "@/lib/types";
import ReportDetail from "./ReportDetail";

const ReportsMap = dynamic(() => import("./map/ReportsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse bg-gray-200 dark:bg-gray-800" />
  ),
});

const DATE_OPTIONS = [
  { value: 0, label: "Cualquier fecha" },
  { value: 7, label: "Últimos 7 días" },
  { value: 30, label: "Últimos 30 días" },
  { value: 90, label: "Últimos 90 días" },
  { value: 365, label: "Último año" },
];

interface Props {
  reports: PublicReport[];
  neighborhoods: NeighborhoodOption[];
}

export default function MapView({ reports, neighborhoods }: Props) {
  const [type, setType] = useState<ReportType | "all">("all");
  const [category, setCategory] = useState("all");
  const [hood, setHood] = useState("all");
  const [days, setDays] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<PublicReport | null>(null);

  const hoodName = useMemo(() => {
    const m = new Map<number, string>();
    neighborhoods.forEach((n) => m.set(n.id, n.name));
    return m;
  }, [neighborhoods]);

  const categoryOptions = useMemo(
    () => CATEGORIES.filter((c) => type === "all" || c.type === type),
    [type]
  );

  const filtered = useMemo(() => {
    const limit = days > 0 ? Date.now() - days * 86400000 : 0;
    return reports.filter((r) => {
      if (type !== "all" && r.type !== type) return false;
      if (category !== "all" && r.category !== category) return false;
      if (hood !== "all" && String(r.neighborhood_id) !== hood) return false;
      if (limit && new Date(r.created_at).getTime() < limit) return false;
      return true;
    });
  }, [reports, type, category, hood, days]);

  const activeFilters =
    (type !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (hood !== "all" ? 1 : 0) +
    (days > 0 ? 1 : 0);

  function reset() {
    setType("all");
    setCategory("all");
    setHood("all");
    setDays(0);
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>{filtered.length}</strong> reporte{filtered.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            {activeFilters > 0 && (
              <button type="button" onClick={reset} className="text-xs text-brand-600 underline">
                Limpiar
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="btn btn-secondary btn-sm"
            >
              🔍 Filtros{activeFilters > 0 ? ` (${activeFilters})` : ""}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <select
              className="input"
              value={type}
              onChange={(e) => {
                setType(e.target.value as ReportType | "all");
                setCategory("all");
              }}
              aria-label="Tipo"
            >
              <option value="all">Todos los tipos</option>
              {(Object.keys(TYPE_LABELS) as ReportType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Categoría"
            >
              <option value="all">Todas las categorías</option>
              {categoryOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={hood}
              onChange={(e) => setHood(e.target.value)}
              aria-label="Barrio"
            >
              <option value="all">Todos los barrios</option>
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              aria-label="Fecha"
            >
              {DATE_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <ReportsMap
          reports={filtered}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />

        {selected && (
          <div className="absolute inset-x-0 bottom-0 z-[1100] max-h-[70%] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl dark:bg-gray-900 lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-96 lg:rounded-none">
            <ReportDetail
              report={selected}
              neighborhoodName={
                selected.neighborhood_id ? hoodName.get(selected.neighborhood_id) : null
              }
              onClose={() => setSelected(null)}
            />
          </div>
        )}

        <div className="pointer-events-none absolute left-2 top-2 z-[1000] rounded-lg bg-white/90 px-2 py-1 text-[11px] shadow dark:bg-gray-900/90">
          <span className="mr-2">🔵 Infraestructura</span>
          <span className="mr-2">🔴 Seguridad</span>
          <span>🟢 Resuelto</span>
        </div>
      </div>
    </div>
  );
}
