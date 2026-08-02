import ListingsManager from "@/components/admin/ListingsManager";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";

export default async function ListingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  return <ListingsManager initialListings={(data ?? []) as Listing[]} />;
}
