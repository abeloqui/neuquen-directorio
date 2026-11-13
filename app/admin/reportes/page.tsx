import Link from "next/link";
import ReportTable from "@/components/admin/ReportTable";
import { ALL_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { AdminReport, ReportStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("reports")
    .select("*, neighborhoods(name)")
    .order("created_at", { ascending: false })
    .limit(1000);

  const all: AdminReport[] = (
    (data ?? []) as unknown as (Omit<AdminReport, "neighborhood_name"> & {
      neighborhoods: { name: string } | null;
    })[]
  ).map(({ neighborhoods, ...r }) => ({
    ...r,
    neighborhood_name: neighborhoods?.name ?? null,
  }));

  const current = ALL_STATUSES.includes(searchParams.status as ReportStatus)
    ? (searchParams.status as ReportStatus)
    : null;

  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<ReportStatus, number>;
  all.forEach((r) => {
    counts[r.status] += 1;
  });

  const list = current ? all.filter((r) => r.status === current) : all;

  const tabs: { key: ReportStatus | null; label: string; count: number }[] = [
    { key: null, label: "Todos", count: all.length },
    ...ALL_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s], count: counts[s] })),
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <Link href="/admin/reportes/nuevo" className="btn btn-primary btn-sm">
          + Nuevo
        </Link>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.key ? `/admin/reportes?status=${t.key}` : "/admin/reportes"}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${
              current === t.key
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-gray-300 dark:border-gray-700"
            }`}
          >
            {t.label} ({t.count})
          </Link>
        ))}
      </div>

      <ReportTable reports={list} />
    </div>
  );
}
