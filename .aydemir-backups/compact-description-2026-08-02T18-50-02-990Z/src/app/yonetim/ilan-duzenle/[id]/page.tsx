import { notFound } from "next/navigation";
import ListingEditor from "@/components/admin/ListingEditor";
import { getListingById } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { ListingPrivateDetails } from "@/lib/types";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditListingPage({
  params,
}: Props) {
  const { id } = await params;
  const result = await getListingById(id);

  if (!result) {
    notFound();
  }

  const supabase = await createClient();

  const [
    { data: { user } },
    { data: privateDetails },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("listing_private_details")
      .select("*")
      .eq("listing_id", id)
      .maybeSingle(),
  ]);

  return (
    <ListingEditor
      mode="edit"
      userId={user!.id}
      initialListing={result.listing}
      initialImages={result.images}
      initialPrivateDetails={
        (privateDetails ??
          null) as ListingPrivateDetails | null
      }
    />
  );
}
