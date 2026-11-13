import RankingEditor from "@/components/admin/RankingEditor";
import { createClient } from "@/lib/supabase/server";
import type { RankingRow, RankingSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminRankingPage() {
  const supabase = createClient();
  const [rank, sett] = await Promise.all([
    supabase.from("neighborhood_ranking").select("*").order("position"),
    supabase.from("ranking_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const settings = sett.data as RankingSettings | null;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Ranking de barrios</h1>
      {settings ? (
        <RankingEditor settings={settings} rows={(rank.data ?? []) as RankingRow[]} />
      ) : (
        <p className="text-sm text-red-600">
          No se encontró la configuración del ranking. Ejecutá de nuevo supabase/schema.sql.
        </p>
      )}
    </div>
  );
}
