"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { DEFAULT_ZOOM, NEUQUEN_CENTER } from "@/lib/constants";
import type { PublicReport } from "@/lib/types";
import { makeReportIcon } from "./markerIcons";

function FlyTo({ report }: { report: PublicReport | null }) {
  const map = useMap();
  useEffect(() => {
    if (report) {
      map.flyTo([report.lat, report.lng], Math.max(map.getZoom(), 15), {
        duration: 0.6,
      });
    }
  }, [report, map]);
  return null;
}

interface Props {
  reports: PublicReport[];
  selectedId: string | null;
  onSelect: (report: PublicReport) => void;
}

export default function ReportsMap({ reports, selectedId, onSelect }: Props) {
  const selected = useMemo(
    () => reports.find((r) => r.id === selectedId) ?? null,
    [reports, selectedId]
  );

  return (
    <MapContainer
      center={NEUQUEN_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={10}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo report={selected} />
      {reports.map((r) => (
        <Marker
          key={r.id}
          position={[r.lat, r.lng]}
          icon={makeReportIcon({
            type: r.type,
            category: r.category,
            status: r.status,
            featured: r.featured,
            selected: r.id === selectedId,
          })}
          zIndexOffset={r.featured ? 500 : r.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(r) }}
        />
      ))}
    </MapContainer>
  );
}
