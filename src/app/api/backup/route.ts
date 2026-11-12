import { NextResponse } from "next/server";
import { getMe } from "@/lib/auth";
import { exportAll } from "@/lib/backup";

export const dynamic = "force-dynamic";

// Descarrega uma cópia completa dos dados (só admins)
export async function GET() {
  const { supabase, profile } = await getMe();
  if (profile?.role !== "admin") return new NextResponse("Sem permissão", { status: 403 });

  const backup = await exportAll(supabase);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date());
  return new NextResponse(JSON.stringify(backup, null, 1), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="dyvi-plataforma-backup-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
