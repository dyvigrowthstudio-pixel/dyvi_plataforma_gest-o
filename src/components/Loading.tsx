import { ArrowUpRight } from "lucide-react";

// Ecrã mostrado de imediato enquanto a página seguinte carrega
export default function LoadingView() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 shrink-0 border-r border-line bg-panel px-3 py-5">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-card">
            <ArrowUpRight size={20} className="text-cyan" />
          </div>
          <div>
            <div className="font-display text-lg font-bold leading-none text-white">Dyvi</div>
            <div className="mt-1 text-[10px] font-bold tracking-[0.22em] text-cyan">GROWTH STUDIO</div>
          </div>
        </div>
        <div className="mt-8 animate-pulse space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 rounded-xl bg-white/5" />
          ))}
        </div>
      </aside>
      <div className="flex-1 animate-pulse">
        <div className="h-[77px] border-b border-line bg-panel/60" />
        <div className="space-y-6 px-8 py-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card h-36" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="card h-64 xl:col-span-2" />
            <div className="card h-64" />
          </div>
        </div>
      </div>
    </div>
  );
}
