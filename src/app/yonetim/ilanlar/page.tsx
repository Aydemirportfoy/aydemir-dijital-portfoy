import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import ListingsManager from "./ListingsManager";

export default async function ListingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  return <ListingsManager />;
}
