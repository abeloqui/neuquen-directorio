import Link from "next/link";
import StatsCharts from "@/components/admin/StatsCharts";
import { ALL_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface Row {
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  neighborhoods: { name: string } | null;
}

export default async function AdminStatsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("reports")
    .select("status, created_at, resolved_at, neighborhoods(name)")
    .limit(5000);

  const rows = (data ?? []) as unknown as Row[];

  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<ReportStatus, number>;
  rows.forEach((r) => {
    counts[r.status] += 1;
  });

  const byStatus = ALL_STATUSES.map((s) => ({ label: STATUS_LABELS[s], value: counts[s] }));

  const hoodMap = new Map<string, number>();
  rows.forEach((r) => {
    if (r.status === "approved" || r.status === "in_progress") {
      const name = r.neighborhoods?.name ?? "Sin barrio";
      hoodMap.set(name, (hoodMap.get(name) ?? 0) + 1);
    }
  });
  const topHoods = Array.from(hoodMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const now = new Date();
  const months: { key: string; month: string; creados: number; resueltos: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      creados: 0,
      resueltos: 0,
    });
  }
  const keyOf = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}`;
  };
  rows.forEach((r) => {
    const c = months.find((m) => m.key === keyOf(r.created_at));
    if (c) c.creados += 1;
    if (r.resolved_at) {
      const s = months.find((m) => m.key === keyOf(r.resolved_at as string));
      if (s) s.resueltos += 1;
    }
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Estadísticas</h1>

      {counts.pending > 0 && (
        <Link
          href="/admin/reportes?status=pending"
          className="card flex items-center justify-between !border-amber-300 !bg-amber-50 dark:!border-amber-700 dark:!bg-amber-900/20"
        >
          <span className="font-semibold">
            ⏳ Tenés {counts.pending} reporte{counts.pending === 1 ? "" : "s"} pendiente
            {counts.pending === 1 ? "" : "s"} de revisión
          </span>
          <span className="text-sm text-brand-600">Revisar →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ALL_STATUSES.map((s) => (
          <Link key={s} href={`/admin/reportes?status=${s}`} className="card text-center">
            <p className="text-3xl font-bold">{counts[s]}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{STATUS_LABELS[s]}</p>
          </Link>
        ))}
      </div>

      <StatsCharts byStatus={byStatus} topHoods={topHoods} evolution={months} />
    </div>
  );
}
