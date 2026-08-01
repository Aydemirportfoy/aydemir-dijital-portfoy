import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import NewListingForm from "./NewListingForm";

export default async function NewListingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  return <NewListingForm />;
}
