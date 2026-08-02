import PresentationsManager from "@/components/admin/PresentationsManager";
import { createClient } from "@/lib/supabase/server";
import type { Presentation } from "@/lib/types";

export default async function PresentationsPage() {
  const supabase = await createClient();

  const [{ data: presentations }, { data: links }] = await Promise.all([
    supabase.from("presentations").select("*").order("created_at", { ascending: false }),
    supabase.from("presentation_listings").select("presentation_id"),
  ]);

  const counts = new Map<string, number>();
  for (const link of links ?? []) {
    counts.set(link.presentation_id, (counts.get(link.presentation_id) ?? 0) + 1);
  }

  const rows = ((presentations ?? []) as Presentation[]).map((item) => ({
    ...item,
    listingCount: counts.get(item.id) ?? 0,
  }));

  return <PresentationsManager initialRows={rows} />;
}
