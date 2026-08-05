import RequestCenter from "@/components/admin/RequestCenter";
import { createClient } from "@/lib/supabase/server";
import type {
  CustomerRequest,
} from "@/lib/requestTypes";
import type {
  Listing,
} from "@/lib/types";

export default async function RequestsPage() {
  const supabase =
    await createClient();

  const [
    {
      data: requests,
      error: requestError,
    },
    {
      data: listings,
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
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),

    supabase
      .from("listings")
      .select("*")
      .neq(
        "status",
        "sold",
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),

    supabase.auth.getUser(),
  ]);

  return (
    <RequestCenter
      initialRequests={
        (requests ??
          []) as CustomerRequest[]
      }
      listings={
        (listings ??
          []) as Listing[]
      }
      userId={
        user!.id
      }
      setupError={
        requestError
          ? requestError.message
          : null
      }
    />
  );
}
