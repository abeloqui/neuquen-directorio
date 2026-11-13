import ReportEditForm from "@/components/admin/ReportEditForm";
import { createClient } from "@/lib/supabase/server";
import type { NeighborhoodOption } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewReportPage() {
  const supabase = createClient();
  const { data } = await supabase.from("neighborhoods").select("id,name").order("name");

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Nuevo reporte</h1>
      <ReportEditForm mode="new" neighborhoods={(data ?? []) as NeighborhoodOption[]} />
    </div>
  );
}
