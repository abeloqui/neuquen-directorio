import type { RankingSettings } from "./types";

export type Weights = Omit<RankingSettings, "id">;

export const DEFAULT_SETTINGS: Weights = {
  weight_infra_open: 3,
  weight_security: 4,
  weight_resolution_days: 0.1,
  resolution_days_cap: 60,
  weight_resolved_bonus: 1,
  window_days: 90,
};

export interface ScoreInput {
  infra_open: number;
  security_recent: number;
  resolved_recent: number;
  avg_resolution_days: number;
  manual_adjustment: number;
}

// Misma formula que la vista neighborhood_ranking del SQL.
export function computeScore(input: ScoreInput, s: Weights = DEFAULT_SETTINGS) {
  const infra = input.infra_open * s.weight_infra_open;
  const security = input.security_recent * s.weight_security;
  const resolutionTime =
    Math.min(input.avg_resolution_days, s.resolution_days_cap) *
    s.weight_resolution_days;
  const resolvedBonus = -input.resolved_recent * s.weight_resolved_bonus;
  const manual = input.manual_adjustment;
  const raw = infra + security + resolutionTime + resolvedBonus + manual;
  return {
    infra,
    security,
    resolutionTime,
    resolvedBonus,
    manual,
    total: Math.max(0, Math.round(raw * 100) / 100),
  };
}

export function formulaLines(s: Weights): string[] {
  return [
    `+${s.weight_infra_open} puntos por cada problema de infraestructura abierto (aprobado o en proceso)`,
    `+${s.weight_security} puntos por cada reporte de seguridad aprobado en los últimos ${s.window_days} días`,
    `+${s.weight_resolution_days} puntos por cada día de demora promedio en resolver (tope: ${s.resolution_days_cap} días)`,
    `−${s.weight_resolved_bonus} punto por cada problema resuelto en los últimos ${s.window_days} días`,
    `± ajuste manual del administrador (siempre se muestra con su motivo)`,
  ];
}
