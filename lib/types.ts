export type ReportType = "infraestructura" | "seguridad";

export type ReportStatus =
  | "pending"
  | "approved"
  | "in_progress"
  | "resolved"
  | "rejected";

export interface PublicReport {
  id: string;
  type: ReportType;
  category: string;
  title: string;
  description: string;
  photo_url: string | null;
  lat: number;
  lng: number;
  neighborhood_id: number | null;
  author_name: string | null;
  status: ReportStatus;
  featured: boolean;
  created_at: string;
  approved_at: string | null;
  resolved_at: string | null;
}

export interface Report extends PublicReport {
  contact: string | null;
  rejection_reason: string | null;
  updated_at: string;
}

export interface AdminReport extends Report {
  neighborhood_name: string | null;
}

export interface NeighborhoodOption {
  id: number;
  name: string;
}

export interface RankingRow {
  position: number;
  id: number;
  name: string;
  slug: string;
  infra_open: number;
  security_recent: number;
  resolved_recent: number;
  avg_resolution_days: number;
  manual_adjustment: number;
  adjustment_note: string | null;
  score: number;
}

export interface RankingSettings {
  id: number;
  weight_infra_open: number;
  weight_security: number;
  weight_resolution_days: number;
  resolution_days_cap: number;
  weight_resolved_bonus: number;
  window_days: number;
}
