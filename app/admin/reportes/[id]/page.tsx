import { notFound } from "next/navigation";
import ReportEditForm from "@/components/admin/ReportEditForm";
import { createClient } from "@/lib/supabase/server";
import type { NeighborhoodOption, Report } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditReportPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [rep, hoods] = await Promise.all([
    supabase.from("reports").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("neighborhoods").select("id,name").order("name"),
  ]);

  if (!rep.data) notFound();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Editar reporte</h1>
      <ReportEditForm
        mode="edit"
        report={rep.data as Report}
        neighborhoods={(hoods.data ?? []) as NeighborhoodOption[]}
      />
    </div>
  );
}
