import {
  STATUS_COLORS,
  STATUS_LABELS,
  TYPE_COLORS,
  TYPE_LABELS,
  categoryEmoji,
  categoryLabel,
} from "@/lib/constants";
import type { PublicReport } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface Props {
  report: PublicReport;
  neighborhoodName?: string | null;
  onClose?: () => void;
}

export default function ReportDetail({ report, neighborhoodName, onClose }: Props) {
  return (
    <article>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="badge text-white"
            style={{ backgroundColor: TYPE_COLORS[report.type] }}
          >
            {TYPE_LABELS[report.type]}
          </span>
          <span className="badge bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            {categoryEmoji(report.category)} {categoryLabel(report.category)}
          </span>
          <span className={`badge ${STATUS_COLORS[report.status]}`}>
            {STATUS_LABELS[report.status]}
          </span>
          {report.featured && (
            <span className="badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
              ⭐ Destacado
            </span>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg px-2 py-1 text-lg leading-none hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        )}
      </div>

      <h2 className="mt-3 text-lg font-bold">{report.title}</h2>

      {report.photo_url && (
        <img
          src={report.photo_url}
          alt={report.title}
          loading="lazy"
          className="mt-3 max-h-64 w-full rounded-lg object-cover"
        />
      )}

      <p className="mt-3 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
        {report.description}
      </p>

      <dl className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
        <div>📅 Reportado el {formatDate(report.created_at)}</div>
        {neighborhoodName && <div>🏘️ {neighborhoodName}</div>}
        {report.author_name && <div>👤 {report.author_name}</div>}
        {report.status === "resolved" && report.resolved_at && (
          <div>✅ Resuelto el {formatDate(report.resolved_at)}</div>
        )}
      </dl>
    </article>
  );
}
