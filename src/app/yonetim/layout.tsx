import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ManagementLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/giris");

  return <AdminShell email={user.email || ""}>{children}</AdminShell>;
}
