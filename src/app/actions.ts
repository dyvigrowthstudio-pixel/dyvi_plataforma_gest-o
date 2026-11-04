"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BRAND_SECTIONS, slugify } from "@/lib/constants";

const s = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const orNull = (v: string) => (v === "" ? null : v);
const num = (v: string) => (v === "" ? null : Number(v.replace(",", ".")));

function refresh(slug: string) {
  revalidatePath(`/c/${slug}`, "layout");
  revalidatePath("/");
}

async function db() {
  return createClient();
}

// ---------- Clientes ----------
export async function createOrg(fd: FormData) {
  const supabase = await db();
  const name = s(fd, "name");
  if (!name) return;
  let slug = slugify(name);
  const { data: exists } = await supabase.from("organizations").select("id").eq("slug", slug).maybeSingle();
  if (exists) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: org, error } = await supabase
    .from("organizations")
    .insert({ name, slug, color: s(fd, "color") || "#31C2E1" })
    .select()
    .single();
  if (error || !org) throw new Error(error?.message ?? "Erro ao criar cliente");

  await supabase.from("brand_sections").insert(
    DEFAULT_BRAND_SECTIONS.map((b, i) => ({
      org_id: org.id,
      title: b.title,
      kind: b.kind,
      data: b.kind === "swot" ? { forcas: "", fraquezas: "", oportunidades: "", ameacas: "" } : b.kind === "list" ? { items: [] } : {},
      position: i,
    }))
  );
  revalidatePath("/", "layout");
  redirect(`/c/${slug}`);
}

export async function updateOrg(fd: FormData) {
  const supabase = await db();
  const slug = s(fd, "slug");
  const modules = fd.getAll("modules").map(String);
  await supabase
    .from("organizations")
    .update({ name: s(fd, "name"), color: s(fd, "color"), modules })
    .eq("id", s(fd, "org_id"));
  refresh(slug);
  revalidatePath("/", "layout");
}

export async function deleteOrg(fd: FormData) {
  const supabase = await db();
  if (s(fd, "confirm") !== s(fd, "name")) return;
  await supabase.from("organizations").delete().eq("id", s(fd, "org_id"));
  revalidatePath("/", "layout");
  redirect("/clientes");
}

// ---------- Acessos ----------
export async function addMember(fd: FormData) {
  const supabase = await db();
  const org_id = s(fd, "org_id");
  const email = s(fd, "email").toLowerCase();
  const member_type = s(fd, "member_type") === "team" ? "team" : "client";
  if (!email) return;

  const { data: profile } = await supabase.from("profiles").select("id, role").ilike("email", email).maybeSingle();
  if (profile) {
    await supabase.from("org_members").upsert({ org_id, user_id: profile.id, member_type });
    if (member_type === "team" && profile.role === "client") {
      await supabase.from("profiles").update({ role: "team" }).eq("id", profile.id);
    }
  } else {
    await supabase.from("org_invites").upsert({ org_id, email, member_type });
  }
  refresh(s(fd, "slug"));
  revalidatePath("/equipa");
}

export async function removeMember(fd: FormData) {
  const supabase = await db();
  await supabase.from("org_members").delete().eq("org_id", s(fd, "org_id")).eq("user_id", s(fd, "user_id"));
  refresh(s(fd, "slug"));
  revalidatePath("/equipa");
}

export async function removeInvite(fd: FormData) {
  const supabase = await db();
  await supabase.from("org_invites").delete().eq("org_id", s(fd, "org_id")).eq("email", s(fd, "email"));
  refresh(s(fd, "slug"));
  revalidatePath("/equipa");
}

export async function setRole(fd: FormData) {
  const supabase = await db();
  const role = s(fd, "role");
  if (!["admin", "team", "client"].includes(role)) return;
  await supabase.from("profiles").update({ role }).eq("id", s(fd, "user_id"));
  revalidatePath("/equipa");
}

// ---------- Hub da marca ----------
export async function saveBrandSection(fd: FormData) {
  const supabase = await db();
  const kind = s(fd, "kind");
  const patch: Record<string, unknown> = { title: s(fd, "title"), updated_at: new Date().toISOString() };
  if (kind === "swot") {
    patch.data = {
      forcas: s(fd, "forcas"),
      fraquezas: s(fd, "fraquezas"),
      oportunidades: s(fd, "oportunidades"),
      ameacas: s(fd, "ameacas"),
    };
  } else if (kind === "list") {
    patch.data = { items: s(fd, "items").split("\n").map((l) => l.trim()).filter(Boolean) };
  } else {
    patch.body = s(fd, "body");
  }
  await supabase.from("brand_sections").update(patch).eq("id", s(fd, "id"));
  refresh(s(fd, "slug"));
}

export async function addBrandSection(fd: FormData) {
  const supabase = await db();
  const kind = s(fd, "kind") || "text";
  const org_id = s(fd, "org_id");
  const { count } = await supabase.from("brand_sections").select("id", { count: "exact", head: true }).eq("org_id", org_id);
  await supabase.from("brand_sections").insert({
    org_id,
    title: s(fd, "title") || "Nova secção",
    kind,
    data: kind === "swot" ? { forcas: "", fraquezas: "", oportunidades: "", ameacas: "" } : kind === "list" ? { items: [] } : {},
    position: count ?? 0,
  });
  refresh(s(fd, "slug"));
}

export async function deleteBrandSection(fd: FormData) {
  const supabase = await db();
  await supabase.from("brand_sections").delete().eq("id", s(fd, "id"));
  refresh(s(fd, "slug"));
}

export async function saveCompetitor(fd: FormData) {
  const supabase = await db();
  const row = {
    org_id: s(fd, "org_id"),
    name: s(fd, "name"),
    url: orNull(s(fd, "url")),
    strengths: orNull(s(fd, "strengths")),
    weaknesses: orNull(s(fd, "weaknesses")),
    notes: orNull(s(fd, "notes")),
  };
  if (!row.name) return;
  const id = s(fd, "id");
  if (id) await supabase.from("competitors").update(row).eq("id", id);
  else await supabase.from("competitors").insert(row);
  refresh(s(fd, "slug"));
}

export async function deleteCompetitor(fd: FormData) {
  const supabase = await db();
  await supabase.from("competitors").delete().eq("id", s(fd, "id"));
  refresh(s(fd, "slug"));
}

// ---------- Temas ----------
export async function saveTheme(fd: FormData) {
  const supabase = await db();
  const month = s(fd, "month"); // AAAA-MM
  const row = {
    org_id: s(fd, "org_id"),
    month: `${month}-01`,
    title: s(fd, "title"),
    pillar: orNull(s(fd, "pillar")),
    description: orNull(s(fd, "description")),
  };
  if (!row.title || !month) return;
  const id = s(fd, "id");
  if (id) await supabase.from("monthly_themes").update(row).eq("id", id);
  else await supabase.from("monthly_themes").insert(row);
  refresh(s(fd, "slug"));
}

export async function deleteTheme(fd: FormData) {
  const supabase = await db();
  await supabase.from("monthly_themes").delete().eq("id", s(fd, "id"));
  refresh(s(fd, "slug"));
}

// ---------- Publicações ----------
export async function savePost(fd: FormData) {
  const supabase = await db();
  const date = s(fd, "date");
  const time = s(fd, "time") || "12:00";
  // As horas são introduzidas em hora de Lisboa
  const scheduled_at = date ? lisbonToUtc(date, time) : null;
  const row = {
    org_id: s(fd, "org_id"),
    title: s(fd, "title"),
    network: s(fd, "network") || "instagram",
    format: s(fd, "format") || "reel",
    status: s(fd, "status") || "ideia",
    theme_id: orNull(s(fd, "theme_id")),
    caption: orNull(s(fd, "caption")),
    notes: orNull(s(fd, "notes")),
    assignee: orNull(s(fd, "assignee")),
    scheduled_at,
  };
  if (!row.title) return;
  const id = s(fd, "id");
  if (id) await supabase.from("posts").update(row).eq("id", id);
  else await supabase.from("posts").insert(row);
  refresh(s(fd, "slug"));
  back(fd);
}

// Volta à página indicada (só caminhos internos)
function back(fd: FormData) {
  const to = s(fd, "return_to");
  if (to.startsWith("/") && !to.startsWith("//")) redirect(to);
}

export async function setPostStatus(fd: FormData) {
  const supabase = await db();
  await supabase.from("posts").update({ status: s(fd, "status") }).eq("id", s(fd, "id"));
  refresh(s(fd, "slug"));
}

export async function deletePost(fd: FormData) {
  const supabase = await db();
  await supabase.from("posts").delete().eq("id", s(fd, "id"));
  refresh(s(fd, "slug"));
  back(fd);
}

function lisbonToUtc(date: string, time: string) {
  // Calcula o desfasamento de Lisboa para essa data (hora de verão ou inverno)
  const guess = new Date(`${date}T${time}:00Z`);
  const lisbon = new Date(guess.toLocaleString("en-US", { timeZone: "Europe/Lisbon" }));
  const utc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  const offset = lisbon.getTime() - utc.getTime();
  return new Date(guess.getTime() - offset).toISOString();
}

// ---------- Ideias ----------
export async function addIdea(fd: FormData) {
  const supabase = await db();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const title = s(fd, "title");
  if (!title) return;
  await supabase.from("ideas").insert({
    org_id: s(fd, "org_id"),
    title,
    description: orNull(s(fd, "description")),
    created_by: user?.id,
  });
  refresh(s(fd, "slug"));
}

export async function setIdeaStatus(fd: FormData) {
  const supabase = await db();
  await supabase.from("ideas").update({ status: s(fd, "status") }).eq("id", s(fd, "id"));
  refresh(s(fd, "slug"));
}

export async function deleteIdea(fd: FormData) {
  const supabase = await db();
  await supabase.from("ideas").delete().eq("id", s(fd, "id"));
  refresh(s(fd, "slug"));
}

// ---------- Tarefas ----------
export async function addTask(fd: FormData) {
  const supabase = await db();
  const title = s(fd, "title");
  if (!title) return;
  await supabase.from("tasks").insert({
    org_id: s(fd, "org_id"),
    title,
    description: orNull(s(fd, "description")),
    owner_side: s(fd, "owner_side") === "cliente" ? "cliente" : "dyvi",
    due_date: orNull(s(fd, "due_date")),
  });
  refresh(s(fd, "slug"));
}

export async function setTaskStatus(fd: FormData) {
  const supabase = await db();
  await supabase.from("tasks").update({ status: s(fd, "status") }).eq("id", s(fd, "id"));
  refresh(s(fd, "slug"));
}

export async function deleteTask(fd: FormData) {
  const supabase = await db();
  await supabase.from("tasks").delete().eq("id", s(fd, "id"));
  refresh(s(fd, "slug"));
}

// ---------- Resultados ----------
export async function saveMetric(fd: FormData) {
  const supabase = await db();
  const month = s(fd, "month");
  if (!month) return;
  await supabase.from("metrics").upsert(
    {
      org_id: s(fd, "org_id"),
      month: `${month}-01`,
      network: s(fd, "network") || "instagram",
      followers: num(s(fd, "followers")),
      reach: num(s(fd, "reach")),
      impressions: num(s(fd, "impressions")),
      views: num(s(fd, "views")),
      engagement_rate: num(s(fd, "engagement_rate")),
      retention_rate: num(s(fd, "retention_rate")),
      notes: orNull(s(fd, "notes")),
    },
    { onConflict: "org_id,month,network" }
  );
  refresh(s(fd, "slug"));
}

export async function deleteMetric(fd: FormData) {
  const supabase = await db();
  await supabase.from("metrics").delete().eq("id", s(fd, "id"));
  refresh(s(fd, "slug"));
}

// ---------- Conta ----------
export async function updateProfile(fd: FormData) {
  const supabase = await db();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ full_name: orNull(s(fd, "full_name")) }).eq("id", user.id);
  revalidatePath("/", "layout");
}

export async function updatePassword(fd: FormData) {
  const supabase = await db();
  const password = s(fd, "password");
  if (password.length < 8) return;
  await supabase.auth.updateUser({ password });
  redirect("/conta?ok=1");
}
