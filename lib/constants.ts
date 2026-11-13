import type { ReportStatus, ReportType } from "./types";

export const NEUQUEN_CENTER: [number, number] = [-38.9516, -68.0591];
export const DEFAULT_ZOOM = 12;

export const LAT_MIN = -39.5;
export const LAT_MAX = -38.5;
export const LNG_MIN = -69.0;
export const LNG_MAX = -68.0;

export const TYPE_LABELS: Record<ReportType, string> = {
  infraestructura: "Infraestructura",
  seguridad: "Seguridad",
};

export const TYPE_COLORS: Record<ReportType, string> = {
  infraestructura: "#2563eb",
  seguridad: "#dc2626",
};

export const CATEGORIES: {
  slug: string;
  type: ReportType;
  label: string;
  emoji: string;
}[] = [
  { slug: "bache", type: "infraestructura", label: "Bache / calle en mal estado", emoji: "🕳️" },
  { slug: "luminaria", type: "infraestructura", label: "Luminaria apagada o rota", emoji: "💡" },
  { slug: "basural", type: "infraestructura", label: "Basural / residuos", emoji: "🗑️" },
  { slug: "agua-cloacas", type: "infraestructura", label: "Pérdida de agua / cloacas", emoji: "💧" },
  { slug: "semaforo", type: "infraestructura", label: "Semáforo / señalización", emoji: "🚦" },
  { slug: "espacio-publico", type: "infraestructura", label: "Plaza / espacio público", emoji: "🌳" },
  { slug: "otro-infra", type: "infraestructura", label: "Otro (infraestructura)", emoji: "🔧" },
  { slug: "robo", type: "seguridad", label: "Robo / hurto", emoji: "🚨" },
  { slug: "vandalismo", type: "seguridad", label: "Vandalismo", emoji: "🧱" },
  { slug: "zona-peligrosa", type: "seguridad", label: "Zona peligrosa / sin iluminación", emoji: "⚠️" },
  { slug: "transito", type: "seguridad", label: "Conducción peligrosa / tránsito", emoji: "🚗" },
  { slug: "otro-seg", type: "seguridad", label: "Otro (seguridad)", emoji: "🛡️" },
];

export function categoriesFor(type: ReportType) {
  return CATEGORIES.filter((c) => c.type === type);
}

export function categoryLabel(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function categoryEmoji(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.emoji ?? "📍";
}

export const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  in_progress: "En proceso",
  resolved: "Resuelto",
  rejected: "Rechazado",
};

export const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  rejected: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

export const ALL_STATUSES: ReportStatus[] = [
  "pending",
  "approved",
  "in_progress",
  "resolved",
  "rejected",
];

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_BUCKET = "report-photos";
