import type { Metadata } from "next";
import RankingTable from "@/components/RankingTable";
import { createPublicClient } from "@/lib/supabase/public";
import { DEFAULT_SETTINGS, formulaLines, type Weights } from "@/lib/ranking";
import type { RankingRow, RankingSettings } from "@/lib/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Ranking de barrios",
  description:
    "Ranking transparente de los barrios de Neuquén Capital según reportes aprobados de infraestructura y seguridad.",
};

export default async function RankingPage() {
  const supabase = createPublicClient();
  const [rank, sett] = await Promise.all([
    supabase.from("neighborhood_ranking").select("*").order("position"),
    supabase.from("ranking_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const rows = (rank.data ?? []) as RankingRow[];
  const s = sett.data as RankingSettings | null;
  const weights: Weights = s
    ? {
        weight_infra_open: Number(s.weight_infra_open),
        weight_security: Number(s.weight_security),
        weight_resolution_days: Number(s.weight_resolution_days),
        resolution_days_cap: Number(s.resolution_days_cap),
        weight_resolved_bonus: Number(s.weight_resolved_bonus),
        window_days: Number(s.window_days),
      }
    : DEFAULT_SETTINGS;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold">🏆 Ranking de barrios</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Un puntaje más alto significa más problemas acumulados. El puesto 1 es el
        barrio con más reportes aprobados sin resolver. Tocá un barrio para ver el detalle.
      </p>

      <section className="card mt-5">
        <h2 className="font-semibold">¿Cómo se calcula?</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Solo cuentan reportes aprobados por el administrador.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
          {formulaLines(weights).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          El puntaje no se divide por población ni superficie, por lo que los
          barrios más grandes pueden acumular más reportes.
        </p>
      </section>

      <div className="mt-5">
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no hay datos para mostrar.</p>
        ) : (
          <RankingTable rows={rows} />
        )}
      </div>
    </div>
  );
}
