import Link from "next/link";
import { Eye, Heart, Users, Repeat, Plus, Trash2 } from "lucide-react";
import { Stat, Empty } from "@/components/Shell";
import { ClientShell, Hidden, Select, loadClient } from "@/components/client";
import { deleteMetric, saveMetric } from "@/app/actions";
import { NETWORKS, labelOf } from "@/lib/constants";
import { monthLabel, todayLisbon } from "@/lib/dates";

type M = {
  id: string; month: string; network: string; followers: number | null; reach: number | null; impressions: number | null;
  views: number | null; engagement_rate: number | null; retention_rate: number | null; notes: string | null;
};

const nf = new Intl.NumberFormat("pt-PT");
const fmt = (v: number | null) => (v == null ? "·" : nf.format(v));

function delta(cur: number | null, prev: number | null) {
  if (cur == null || prev == null || prev === 0) return undefined;
  const d = ((cur - prev) / prev) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(1).replace(".", ",")}% vs mês anterior`;
}

function Bars({ data, label, color }: { data: { m: string; v: number | null }[]; label: string; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.v ?? 0));
  return (
    <div className="card">
      <h3 className="h2 mb-4">{label}</h3>
      {data.length === 0 ? (
        <Empty>Sem dados.</Empty>
      ) : (
        <div className="flex h-44 items-end gap-3">
          {data.map((d) => (
            <div key={d.m} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-300">{d.v == null ? "" : nf.format(d.v)}</span>
              <div className="w-full rounded-t-lg" style={{ height: `${((d.v ?? 0) / max) * 120}px`, background: color, minHeight: 4 }} />
              <span className="text-[11px] text-muted">{monthLabel(d.m.slice(0, 7)).slice(0, 3)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function Resultados({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ rede?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, org, isStaff } = await loadClient(slug, "resultados");
  const { data } = await supabase.from("metrics").select("*").eq("org_id", org.id).order("month");
  const all = (data ?? []) as M[];
  const networks = [...new Set(all.map((m) => m.network))];
  const net = sp.rede && networks.includes(sp.rede) ? sp.rede : networks[0] ?? "instagram";
  const rows = all.filter((m) => m.network === net);
  const last = rows.at(-1) ?? null;
  const prev = rows.at(-2) ?? null;
  const recent = rows.slice(-6);

  return (
    <ClientShell org={org} isStaff={isStaff} module="resultados" subtitle={`${org.name} · evolução mensal das redes`}>
      {networks.length > 1 && (
        <div className="mb-4 flex gap-2">
          {networks.map((n) => (
            <Link key={n} href={`/c/${slug}/resultados?rede=${n}`} className={`pill ${n === net ? "bg-cyan text-ink" : "bg-white/5 text-muted"}`}>
              {labelOf(NETWORKS, n)}
            </Link>
          ))}
        </div>
      )}

      {last ? (
        <>
          <p className="mb-3 text-sm text-muted">{labelOf(NETWORKS, net)} · {monthLabel(last.month.slice(0, 7))}</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={Eye} value={fmt(last.reach)} label="Alcance" tone="cyan" tag={delta(last.reach, prev?.reach ?? null)} />
            <Stat icon={Heart} value={last.engagement_rate == null ? "·" : `${String(last.engagement_rate).replace(".", ",")}%`} label="Taxa de engagement" tone="magenta" tag={delta(last.engagement_rate, prev?.engagement_rate ?? null)} />
            <Stat icon={Repeat} value={last.retention_rate == null ? "·" : `${String(last.retention_rate).replace(".", ",")}%`} label="Taxa de retenção" tone="violet" tag={delta(last.retention_rate, prev?.retention_rate ?? null)} />
            <Stat icon={Users} value={fmt(last.followers)} label="Seguidores" tone="emerald" tag={delta(last.followers, prev?.followers ?? null)} />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Bars label="Alcance por mês" color="linear-gradient(180deg,#31C2E1,#2a8fd6)" data={recent.map((r) => ({ m: r.month, v: r.reach }))} />
            <Bars label="Engagement por mês (%)" color="linear-gradient(180deg,#FF3D7F,#7C5CFF)" data={recent.map((r) => ({ m: r.month, v: r.engagement_rate == null ? null : Number(r.engagement_rate) }))} />
          </div>
        </>
      ) : (
        <Empty>Ainda sem resultados registados.{isStaff && " Adiciona o primeiro mês abaixo."}</Empty>
      )}

      <section className="card mt-6">
        <h2 className="h2 mb-4">Histórico</h2>
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted">
                  <th className="pb-3">Mês</th><th className="pb-3">Seguidores</th><th className="pb-3">Alcance</th><th className="pb-3">Impressões</th>
                  <th className="pb-3">Visualizações</th><th className="pb-3">Engagement</th><th className="pb-3">Retenção</th><th className="pb-3">Notas</th><th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-200">
                {[...rows].reverse().map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 font-semibold text-white">{monthLabel(r.month.slice(0, 7))}</td>
                    <td>{fmt(r.followers)}</td><td>{fmt(r.reach)}</td><td>{fmt(r.impressions)}</td><td>{fmt(r.views)}</td>
                    <td>{r.engagement_rate == null ? "·" : `${r.engagement_rate}%`}</td>
                    <td>{r.retention_rate == null ? "·" : `${r.retention_rate}%`}</td>
                    <td className="max-w-48 truncate text-muted">{r.notes}</td>
                    <td>
                      {isStaff && (
                        <form action={deleteMetric}>
                          <Hidden org={org} extra={{ id: r.id }} />
                          <button className="btn-danger"><Trash2 size={14} /></button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {isStaff && (
          <details className="mt-4" open={rows.length === 0}>
            <summary className="inline-flex items-center gap-2 text-sm font-semibold text-cyan"><Plus size={16} /> Registar mês</summary>
            <form action={saveMetric} className="mt-3 grid gap-3 md:grid-cols-4">
              <Hidden org={org} />
              <div><label className="label">Mês</label><input type="month" name="month" required defaultValue={todayLisbon().slice(0, 7)} className="input" /></div>
              <div><label className="label">Rede</label><Select name="network" options={NETWORKS} defaultValue={net} /></div>
              <div><label className="label">Seguidores</label><input name="followers" inputMode="numeric" className="input" /></div>
              <div><label className="label">Alcance</label><input name="reach" inputMode="numeric" className="input" /></div>
              <div><label className="label">Impressões</label><input name="impressions" inputMode="numeric" className="input" /></div>
              <div><label className="label">Visualizações</label><input name="views" inputMode="numeric" className="input" /></div>
              <div><label className="label">Engagement (%)</label><input name="engagement_rate" inputMode="decimal" className="input" /></div>
              <div><label className="label">Retenção (%)</label><input name="retention_rate" inputMode="decimal" className="input" /></div>
              <div className="md:col-span-4"><label className="label">Notas</label><input name="notes" className="input" placeholder="O que correu bem, o que mudar" /></div>
              <div><button className="btn">Guardar mês</button></div>
            </form>
            <p className="mt-2 text-xs text-muted">Se o mês e a rede já existirem, os valores são atualizados.</p>
          </details>
        )}
      </section>
    </ClientShell>
  );
}
