import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Shell, { Empty } from "@/components/Shell";
import { getMe } from "@/lib/auth";

export default async function Clientes() {
  const { supabase } = await getMe();
  const { data: orgs } = await supabase.from("organizations").select("id, name, slug, color, modules").order("name");

  return (
    <Shell title="Clientes" subtitle="Todas as organizações a que tens acesso">
      {(orgs ?? []).length === 0 ? (
        <Empty>Ainda não há clientes.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(orgs ?? []).map((o) => (
            <Link key={o.id} href={`/c/${o.slug}`} className="card group hover:border-cyan/50">
              <div className="flex items-center gap-3">
                <div className="icon-tile font-display text-lg font-bold text-ink" style={{ background: o.color ?? "#31C2E1" }}>
                  {o.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-white">{o.name}</div>
                <ChevronRight size={18} className="text-muted group-hover:text-cyan" />
              </div>
              <div className="mt-3 text-xs text-muted">{o.modules.length} módulos ativos</div>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}
