import type { Metadata } from "next";
import ReportForm from "@/components/ReportForm";
import { createPublicClient } from "@/lib/supabase/public";
import type { NeighborhoodOption } from "@/lib/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Hacer un reporte",
  description:
    "Reportá un problema de infraestructura o seguridad en tu barrio de Neuquén Capital. No necesitás registrarte.",
};

export default async function ReportarPage() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("neighborhoods").select("id,name").order("name");

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-bold">Hacer un reporte</h1>
      <p className="mb-6 mt-1 text-sm text-gray-600 dark:text-gray-400">
        No necesitás registrarte. El reporte queda pendiente hasta que sea revisado.
      </p>
      <ReportForm neighborhoods={(data ?? []) as NeighborhoodOption[]} />
    </div>
  );
}
