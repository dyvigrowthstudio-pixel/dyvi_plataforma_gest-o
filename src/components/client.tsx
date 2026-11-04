import { notFound } from "next/navigation";
import Shell from "./Shell";
import { getOrgContext, type Org } from "@/lib/auth";
import { MODULES } from "@/lib/constants";

export async function loadClient(slug: string, module?: string) {
  const ctx = await getOrgContext(slug);
  if (module && !ctx.org.modules.includes(module)) notFound();
  return ctx;
}

export function ClientShell({
  org,
  isStaff,
  module,
  subtitle,
  actions,
  title,
  children,
}: {
  title?: string;
  org: Org;
  isStaff: boolean;
  module?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const label = module ? MODULES.find((m) => m.key === module)?.label ?? module : org.name;
  return (
    <Shell
      title={title ?? (module ? label : org.name)}
      subtitle={subtitle ?? (module ? org.name : "Visão geral do cliente")}
      actions={actions}
      current={{ slug: org.slug, name: org.name, modules: org.modules, isStaff }}
    >
      {children}
    </Shell>
  );
}

export function Hidden({ org, extra }: { org: Org; extra?: Record<string, string> }) {
  return (
    <>
      <input type="hidden" name="org_id" value={org.id} />
      <input type="hidden" name="slug" value={org.slug} />
      {extra && Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
    </>
  );
}

export function Select({
  name,
  options,
  defaultValue,
  className = "",
}: {
  name: string;
  options: readonly { key: string; label: string }[];
  defaultValue?: string | null;
  className?: string;
}) {
  return (
    <select name={name} defaultValue={defaultValue ?? undefined} className={`input ${className}`}>
      {options.map((o) => (
        <option key={o.key} value={o.key}>{o.label}</option>
      ))}
    </select>
  );
}

// Botões de estado que submetem logo ao clicar
export function StatusButtons({
  action,
  id,
  org,
  current,
  options,
  colors,
}: {
  action: (fd: FormData) => Promise<void>;
  id: string;
  org: Org;
  current: string;
  options: readonly { key: string; label: string }[];
  colors: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <form key={o.key} action={action}>
          <Hidden org={org} extra={{ id, status: o.key }} />
          <button
            className={`pill transition ${
              current === o.key ? `${colors[o.key]} ring-1 ring-current` : "bg-white/5 text-muted hover:text-white"
            }`}
          >
            {o.label}
          </button>
        </form>
      ))}
    </div>
  );
}
