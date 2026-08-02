import { notFound } from "next/navigation";
import ListingEditor from "@/components/admin/ListingEditor";
import { getListingById } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  const result = await getListingById(id);
  if (!result) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ListingEditor
      mode="edit"
      userId={user!.id}
      initialListing={result.listing}
      initialImages={result.images}
    />
  );
}
