"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Marker as LMarker } from "leaflet";
import { DEFAULT_ZOOM, NEUQUEN_CENTER } from "@/lib/constants";
import { makePinIcon } from "./markerIcons";

export interface LatLng {
  lat: number;
  lng: number;
}

function ClickHandler({ onChange }: { onChange: (v: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FlyTo({ target }: { target: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16, { duration: 0.6 });
  }, [target, map]);
  return null;
}

interface Props {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
}

export default function LocationPicker({ value, onChange }: Props) {
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (value && !flyTarget) setFlyTarget(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function locateMe() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no permite geolocalización.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(p);
        setFlyTarget(p);
        setLocating(false);
      },
      () => {
        setGeoError("No pudimos obtener tu ubicación. Marcala en el mapa.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={locateMe}
        disabled={locating}
        className="btn btn-secondary btn-sm mb-2"
      >
        {locating ? "Buscando…" : "📡 Usar mi ubicación"}
      </button>
      {geoError && <p className="mb-2 text-xs text-red-600">{geoError}</p>}
      <div className="h-72 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
        <MapContainer
          center={value ? [value.lat, value.lng] : NEUQUEN_CENTER}
          zoom={value ? 16 : DEFAULT_ZOOM}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={onChange} />
          <FlyTo target={flyTarget} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={makePinIcon()}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = (e.target as LMarker).getLatLng();
                  onChange({ lat: ll.lat, lng: ll.lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {value
          ? `Ubicación marcada (${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}). Podés arrastrar el pin.`
          : "Tocá el mapa para marcar el lugar exacto."}
      </p>
    </div>
  );
}
