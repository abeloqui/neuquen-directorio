import L from "leaflet";
import { TYPE_COLORS, categoryEmoji } from "@/lib/constants";
import type { ReportStatus, ReportType } from "@/lib/types";

export function makeReportIcon(opts: {
  type: ReportType;
  category: string;
  status: ReportStatus;
  featured: boolean;
  selected: boolean;
}) {
  const color = opts.status === "resolved" ? "#16a34a" : TYPE_COLORS[opts.type];
  const size = opts.selected ? 44 : 36;
  const ring = opts.featured ? "0 0 0 3px #facc15," : "";
  const opacity = opts.status === "resolved" ? 0.85 : 1;
  const star = opts.featured
    ? `<span style="position:absolute;top:-8px;right:-6px;font-size:14px;">⭐</span>`
    : "";

  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:3px solid #fff;display:flex;align-items:center;
      justify-content:center;font-size:${opts.selected ? 20 : 17}px;opacity:${opacity};
      box-shadow:${ring}0 2px 6px rgba(0,0,0,.45);">
      ${categoryEmoji(opts.category)}${star}
    </div>`;

  return L.divIcon({
    html,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function makePinIcon() {
  return L.divIcon({
    html: `<div style="font-size:34px;line-height:34px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5));">📍</div>`,
    className: "custom-marker",
    iconSize: [34, 34],
    iconAnchor: [17, 32],
  });
}
