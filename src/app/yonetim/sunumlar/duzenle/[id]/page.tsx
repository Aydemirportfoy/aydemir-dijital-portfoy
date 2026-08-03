import {
  notFound,
} from "next/navigation";
import PresentationEditor from "@/components/admin/PresentationEditor";
import { createClient } from "@/lib/supabase/server";
import type {
  Listing,
  Presentation,
} from "@/lib/types";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPresentationPage({
  params,
}: Props) {
  const { id } = await params;
  const supabase =
    await createClient();

  const [
    {
      data: presentation,
    },
    {
      data: listings,
    },
    {
      data: links,
    },
  ] = await Promise.all([
    supabase
      .from("presentations")
      .select("*")
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .order("title"),

    supabase
      .from(
        "presentation_listings",
      )
      .select(
        "listing_id, position",
      )
      .eq(
        "presentation_id",
        id,
      )
      .order("position", {
        ascending: true,
      }),
  ]);

  if (!presentation) {
    notFound();
  }

  return (
    <PresentationEditor
      presentation={
        presentation as Presentation
      }
      listings={
        (listings ?? []) as Listing[]
      }
      initialSelected={
        (links ?? []).map(
          (link) =>
            link.listing_id,
        )
      }
    />
  );
}
