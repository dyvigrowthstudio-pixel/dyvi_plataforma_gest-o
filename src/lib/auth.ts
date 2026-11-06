import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = { id: string; email: string; full_name: string | null; role: "admin" | "team" | "client" };
export type Org = { id: string; name: string; slug: string; color: string | null; modules: string[] };

// Uma única verificação por pedido, partilhada por todas as partes da página
export const getMe = cache(async () => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) redirect("/login");
  const user = { id: claims.sub as string, email: (claims.email as string) ?? "" };
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { supabase, user, profile: profile as Profile | null, profileError: error?.message ?? null };
});

// Carrega a organização e o nível de acesso do utilizador
export const getOrgContext = cache(async (slug: string) => {
  const { supabase, user, profile } = await getMe();
  const [{ data: org }, { data: m }] = await Promise.all([
    supabase.from("organizations").select("*").eq("slug", slug).maybeSingle(),
    supabase.from("org_members").select("member_type, organizations!inner(slug)").eq("user_id", user.id).eq("organizations.slug", slug).maybeSingle(),
  ]);
  if (!org) notFound();
  const isAdmin = profile?.role === "admin";
  const isStaff = isAdmin || m?.member_type === "team";
  return { supabase, user, profile, org: org as Org, isStaff, isAdmin };
});
