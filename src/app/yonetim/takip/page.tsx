import TrackingCenter from "@/components/admin/TrackingCenter";
import { createClient } from "@/lib/supabase/server";
import type {
  CustomerRequest,
} from "@/lib/requestTypes";

export default async function TrackingPage() {
  const supabase =
    await createClient();

  const [
    {
      data: requests,
      error: requestError,
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
        "follow_up_at",
        {
          ascending: true,
          nullsFirst: false,
        },
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
    <TrackingCenter
      initialRequests={
        (requests ??
          []) as CustomerRequest[]
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
