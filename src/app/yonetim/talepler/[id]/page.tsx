import {
  notFound,
} from "next/navigation";
import RequestDetailManager from "@/components/admin/RequestDetailManager";
import { createClient } from "@/lib/supabase/server";
import type {
  CustomerRequest,
  CustomerRequestNote,
  RequestPresentationLink,
} from "@/lib/requestTypes";
import type {
  Listing,
} from "@/lib/types";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RequestDetailPage({
  params,
}: Props) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  const [
    {
      data: request,
    },
    {
      data: listings,
    },
    {
      data: notes,
    },
    {
      data: relations,
    },
    {
      data: {
        user,
      },
    },
  ] = await Promise.all([
    supabase
      .from(
        "customer_requests",
      )
      .select("*")
      .eq(
        "id",
        id,
      )
      .maybeSingle(),

    supabase
      .from("listings")
      .select("*")
      .eq(
        "status",
        "active",
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),

    supabase
      .from(
        "customer_request_notes",
      )
      .select("*")
      .eq(
        "request_id",
        id,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),

    supabase
      .from(
        "customer_request_presentations",
      )
      .select(
        "id,request_id,presentation_id,created_at,presentation:presentations(id,slug,customer_name,title,status,created_at)",
      )
      .eq(
        "request_id",
        id,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),

    supabase.auth.getUser(),
  ]);

  const normalizedRelations =
    (relations ?? []).map(
      (relation) => {
        const rawPresentation =
          relation.presentation;

        return {
          ...relation,
          presentation:
            Array.isArray(
              rawPresentation,
            )
              ? rawPresentation[0] ??
                null
              : rawPresentation ??
                null,
        };
      },
    ) as unknown as RequestPresentationLink[];

  if (!request) {
    notFound();
  }

  return (
    <RequestDetailManager
      initialRequest={
        request as CustomerRequest
      }
      listings={
        (listings ??
          []) as Listing[]
      }
      initialNotes={
        (notes ??
          []) as CustomerRequestNote[]
      }
      initialPresentations={
        normalizedRelations
      }
      userId={
        user!.id
      }
    />
  );
}
