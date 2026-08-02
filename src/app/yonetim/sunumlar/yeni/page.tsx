import PresentationBuilder from "@/components/admin/PresentationBuilder";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";

export default async function NewPresentationPage() {
  const supabase = await createClient();

  const [{ data: listings }, { data: { user } }] = await Promise.all([
    supabase.from("listings").select("*").eq("status", "active").order("title"),
    supabase.auth.getUser(),
  ]);

  return (
    <PresentationBuilder
      listings={(listings ?? []) as Listing[]}
      userId={user!.id}
    />
  );
}
