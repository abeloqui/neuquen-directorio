import type { RankingRow } from "@/lib/types";

function medal(pos: number) {
  if (pos === 1) return "🥇";
  if (pos === 2) return "🥈";
  if (pos === 3) return "🥉";
  return String(pos);
}

export default function RankingTable({ rows }: { rows: RankingRow[] }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.score)));

  return (
    <ol className="space-y-2">
      {rows.map((r) => (
        <li key={r.id} className="card !p-3">
          <details>
            <summary className="flex cursor-pointer list-none items-center gap-3">
              <span className="w-8 shrink-0 text-center text-lg font-bold">
                {medal(Number(r.position))}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.name}</p>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${(Number(r.score) / max) * 100}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-right text-sm font-bold tabular-nums">
                {Number(r.score).toFixed(1)}
                <span className="block text-[10px] font-normal text-gray-500">puntos</span>
              </span>
            </summary>
            <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-200 pt-3 text-xs dark:border-gray-800 sm:grid-cols-4">
              <div>
                <dt className="text-gray-500">Infraestructura abierta</dt>
                <dd className="font-semibold">{r.infra_open}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Seguridad (reciente)</dt>
                <dd className="font-semibold">{r.security_recent}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Resueltos (reciente)</dt>
                <dd className="font-semibold">{r.resolved_recent}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Días prom. resolución</dt>
                <dd className="font-semibold">{Number(r.avg_resolution_days)}</dd>
              </div>
              {Number(r.manual_adjustment) !== 0 && (
                <div className="col-span-2 sm:col-span-4">
                  <dt className="text-gray-500">Ajuste manual</dt>
                  <dd className="font-semibold">
                    {Number(r.manual_adjustment) > 0 ? "+" : ""}
                    {Number(r.manual_adjustment)}
                    {r.adjustment_note ? ` — ${r.adjustment_note}` : ""}
                  </dd>
                </div>
              )}
            </dl>
          </details>
        </li>
      ))}
    </ol>
  );
}
