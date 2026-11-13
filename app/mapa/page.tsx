import type { Metadata } from "next";
import MapView from "@/components/MapView";
import { createPublicClient } from "@/lib/supabase/public";
import type { NeighborhoodOption, PublicReport } from "@/lib/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Mapa de reportes",
  description:
    "Mapa interactivo de reportes aprobados de infraestructura y seguridad en Neuquén Capital.",
};

export default async function MapaPage() {
  const supabase = createPublicClient();
  const [reports, hoods] = await Promise.all([
    supabase
      .from("public_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("neighborhoods").select("id,name").order("name"),
  ]);

  return (
    <MapView
      reports={(reports.data ?? []) as PublicReport[]}
      neighborhoods={(hoods.data ?? []) as NeighborhoodOption[]}
    />
  );
}
