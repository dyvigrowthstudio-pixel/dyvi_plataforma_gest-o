"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight, LayoutGrid, Users, Sparkles, CalendarDays, Clapperboard, Lightbulb,
  ListChecks, BarChart3, Settings, UserCircle, Gem, Building2,
} from "lucide-react";
import { MODULES } from "@/lib/constants";

const MODULE_ICONS: Record<string, React.ElementType> = {
  marca: Gem,
  temas: Sparkles,
  calendario: CalendarDays,
  producao: Clapperboard,
  ideias: Lightbulb,
  tarefas: ListChecks,
  resultados: BarChart3,
};

type Props = {
  orgs: { name: string; slug: string; color: string | null }[];
  current?: { slug: string; name: string; modules: string[]; isStaff: boolean } | null;
  isAdmin: boolean;
  isStaffAnywhere: boolean;
};

function Item({ href, icon: Icon, label, badge, exact }: { href: string; icon: React.ElementType; label: string; badge?: number; exact?: boolean }) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border border-cyan/70 bg-cyan/10 text-white shadow-[0_0_0_3px_rgba(49,194,225,0.08)]"
          : "border border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={17} className={active ? "text-cyan" : "text-muted"} />
      <span className="flex-1 truncate">{label}</span>
      {badge ? <span className="pill bg-white/8 text-muted">{badge}</span> : null}
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted/80">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default function Sidebar({ orgs, current, isAdmin, isStaffAnywhere }: Props) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-line bg-panel px-3 py-5">
      <Link href="/" className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-card">
          <ArrowUpRight size={20} className="text-cyan" />
        </div>
        <div>
          <div className="font-display text-lg font-bold leading-none text-white">Dyvi</div>
          <div className="mt-1 text-[10px] font-bold tracking-[0.22em] text-cyan">GROWTH STUDIO</div>
        </div>
      </Link>

      <Section title="Principal">
        <Item href="/" icon={LayoutGrid} label="Painel" exact />
        <Item href="/clientes" icon={Users} label="Clientes" badge={orgs.length} />
      </Section>

      {current && (
        <Section title={current.name}>
          <Item href={`/c/${current.slug}`} icon={Building2} label="Visão geral" exact />
          {MODULES.filter((m) => current.modules.includes(m.key)).map((m) => (
            <Item key={m.key} href={`/c/${current.slug}/${m.key}`} icon={MODULE_ICONS[m.key]} label={m.label} />
          ))}
          {current.isStaff && <Item href={`/c/${current.slug}/definicoes`} icon={Settings} label="Definições do cliente" />}
        </Section>
      )}

      {!current && isStaffAnywhere && orgs.length > 0 && (
        <Section title="Clientes">
          {orgs.slice(0, 12).map((o) => (
            <Link
              key={o.slug}
              href={`/c/${o.slug}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: o.color ?? "#31C2E1" }} />
              <span className="truncate">{o.name}</span>
            </Link>
          ))}
        </Section>
      )}

      <Section title="Configuração">
        <Item href="/conta" icon={UserCircle} label="A minha conta" />
        {isAdmin && <Item href="/equipa" icon={Users} label="Equipa" />}
      </Section>
    </aside>
  );
}
