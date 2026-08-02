import ListingsManager from "@/components/admin/ListingsManager";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminListing,
  Listing,
  ListingPrivateDetails,
} from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ListingsPage() {
  const supabase = await createClient();

  const [
    { data: listings },
    { data: privateRows },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .order("created_at", {
        ascending: false,
      }),
    supabase
      .from("listing_private_details")
      .select("*"),
  ]);

  const privateMap = new Map(
    (
      (privateRows ?? []) as ListingPrivateDetails[]
    ).map((row) => [
      row.listing_id,
      row,
    ]),
  );

  const merged = (
    (listings ?? []) as Listing[]
  ).map(
    (listing): AdminListing => ({
      ...listing,
      private_details:
        privateMap.get(listing.id) ?? null,
    }),
  );

  return (
    <ListingsManager
      initialListings={merged}
    />
  );
}
