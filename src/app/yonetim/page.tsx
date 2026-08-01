import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import YonetimClient from "./YonetimClient";

export default async function YonetimPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  return <YonetimClient email={user.email ?? "Yönetici"} />;
}
