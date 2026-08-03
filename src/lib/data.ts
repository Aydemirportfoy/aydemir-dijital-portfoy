import { createClient } from "@/lib/supabase/server";
import type { Listing, ListingImage, Presentation } from "@/lib/types";

export async function getActiveListings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as Listing[];
}

export async function getListingBySlug(slug: string) {
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error || !listing) return null;

  const { data: images } = await supabase
    .from("listing_images")
    .select("*")
    .eq("listing_id", listing.id)
    .order("position", { ascending: true });

  return {
    listing: listing as Listing,
    images: (images ?? []) as ListingImage[]
  };
}

export async function getListingById(id: string) {
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !listing) return null;

  const { data: images } = await supabase
    .from("listing_images")
    .select("*")
    .eq("listing_id", id)
    .order("position", { ascending: true });

  return {
    listing: listing as Listing,
    images: (images ?? []) as ListingImage[]
  };
}

export async function getPresentationBySlug(slug: string) {
  const supabase = await createClient();

  const { data: presentation, error } = await supabase
    .from("presentations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !presentation) return null;

  const { data: links, error: linksError } = await supabase
    .from("presentation_listings")
    .select("listing_id, position")
    .eq("presentation_id", presentation.id)
    .order("position", { ascending: true });

  if (linksError) return null;

  const ids = (links ?? []).map((row) => row.listing_id);
  if (ids.length === 0) {
    return {
      presentation: presentation as Presentation,
      listings: [] as Listing[]
    };
  }

  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .in("id", ids)
    .eq("status", "active");

  const map = new Map((listings ?? []).map((item) => [item.id, item]));
  const ordered = ids.map((id) => map.get(id)).filter(Boolean) as Listing[];

  return {
    presentation: presentation as Presentation,
    listings: ordered
  };
}
