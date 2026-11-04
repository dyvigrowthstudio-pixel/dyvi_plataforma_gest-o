import { LogOut } from "lucide-react";
import Sidebar from "./Sidebar";
import { getMe } from "@/lib/auth";

export default async function Shell({
  title,
  subtitle,
  actions,
  current,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  current?: { slug: string; name: string; modules: string[]; isStaff: boolean } | null;
  children: React.ReactNode;
}) {
  const { supabase, profile } = await getMe();
  const { data: orgs } = await supabase.from("organizations").select("name, slug, color").order("name");
  const isAdmin = profile?.role === "admin";
  const isStaffAnywhere = profile?.role === "admin" || profile?.role === "team";
  const name = profile?.full_name || profile?.email?.split("@")[0] || "";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgs={orgs ?? []} current={current} isAdmin={isAdmin} isStaffAnywhere={isStaffAnywhere} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-line bg-panel/60 px-8 py-4 backdrop-blur">
          <div className="min-w-0 flex-1">
            <h1 className="h1 truncate text-xl">{title}</h1>
            {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
          </div>
          {actions}
          <span className="hidden text-sm font-semibold text-slate-300 sm:block">{name}</span>
          <form action="/auth/signout" method="post">
            <button className="btn-ghost h-9 w-9 !p-0" title="Sair">
              <LogOut size={16} />
            </button>
          </form>
        </header>
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,rgba(124,92,255,0.08),transparent_50%)] px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function Stat({
  icon: Icon,
  value,
  label,
  tag,
  tone = "cyan",
}: {
  icon: React.ElementType;
  value: React.ReactNode;
  label: string;
  tag?: string;
  tone?: "cyan" | "magenta" | "violet" | "emerald";
}) {
  const tones = {
    cyan: "bg-cyan/12 text-cyan",
    magenta: "bg-magenta/12 text-magenta",
    violet: "bg-violet/15 text-[#a993ff]",
    emerald: "bg-emerald-400/12 text-emerald-300",
  };
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className={`icon-tile ${tones[tone]}`}>
          <Icon size={18} />
        </div>
        {tag && <span className={`pill ${tones[tone]}`}>{tag}</span>}
      </div>
      <div className="mt-4 font-display text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-300">{label}</div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">{children}</p>;
}
