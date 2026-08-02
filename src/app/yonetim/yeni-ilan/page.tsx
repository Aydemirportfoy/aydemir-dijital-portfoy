import ListingEditor from "@/components/admin/ListingEditor";
import { createClient } from "@/lib/supabase/server";

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <ListingEditor mode="create" userId={user!.id} />;
}
