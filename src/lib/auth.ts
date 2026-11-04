import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = { id: string; email: string; full_name: string | null; role: "admin" | "team" | "client" };
export type Org = { id: string; name: string; slug: string; color: string | null; modules: string[] };

export async function getMe() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { supabase, user, profile: profile as Profile | null };
}

// Carrega a organização e o nível de acesso do utilizador
export async function getOrgContext(slug: string) {
  const { supabase, user, profile } = await getMe();
  const { data: org } = await supabase.from("organizations").select("*").eq("slug", slug).single();
  if (!org) notFound();

  let isStaff = profile?.role === "admin";
  if (!isStaff) {
    const { data: m } = await supabase
      .from("org_members")
      .select("member_type")
      .eq("org_id", org.id)
      .eq("user_id", user.id)
      .single();
    isStaff = m?.member_type === "team";
  }
  return { supabase, user, profile, org: org as Org, isStaff, isAdmin: profile?.role === "admin" };
}
