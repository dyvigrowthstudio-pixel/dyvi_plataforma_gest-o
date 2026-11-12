"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type LoginState = { ok?: boolean; text?: string } | null;

const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

async function emailFor(identifier: string): Promise<string | null> {
  if (identifier.includes("@")) return identifier.toLowerCase();
  const admin = createServiceClient();
  if (!admin) return null;
  const { data } = await admin.from("profiles").select("email").eq("username", identifier.toLowerCase()).maybeSingle();
  return data?.email ?? null;
}

export async function signIn(_: LoginState, fd: FormData): Promise<LoginState> {
  const identifier = s(fd, "identifier");
  const password = String(fd.get("password") ?? "");
  const email = await emailFor(identifier);
  const generic = { ok: false, text: "Nome de utilizador ou password incorretos." };
  if (!email) {
    if (!identifier.includes("@") && !process.env.SUPABASE_SECRET_KEY)
      return { ok: false, text: "O login por nome ainda não está ativo. Entra com o email." };
    return generic;
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/confirm/i.test(error.message)) return { ok: false, text: "Ainda não confirmaste o email. Abre o link que te enviámos." };
    return generic;
  }
  redirect("/");
}

export async function signUp(_: LoginState, fd: FormData): Promise<LoginState> {
  const email = s(fd, "email").toLowerCase();
  const username = s(fd, "username").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!USERNAME_RE.test(username))
    return { ok: false, text: "O nome de utilizador deve ter 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou underscore." };
  if (password.length < 8) return { ok: false, text: "A password precisa de pelo menos 8 caracteres." };

  const admin = createServiceClient();
  if (admin) {
    const { data: taken } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
    if (taken) return { ok: false, text: "Esse nome de utilizador já está a ser usado. Escolhe outro." };
  }

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback`, data: { username } },
  });
  if (error) return { ok: false, text: error.message };
  return { ok: true, text: "Conta criada. Confirma o email com o link que te enviámos e depois entra com o teu nome de utilizador." };
}

export async function recover(_: LoginState, fd: FormData): Promise<LoginState> {
  const email = await emailFor(s(fd, "identifier"));
  if (email) {
    const h = await headers();
    const origin = h.get("origin") ?? `https://${h.get("host")}`;
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/conta` });
  }
  // Resposta igual quer a conta exista ou não, para não revelar quem está registado
  return { ok: true, text: "Se a conta existir, enviámos um link para o email associado para definires uma password nova." };
}
