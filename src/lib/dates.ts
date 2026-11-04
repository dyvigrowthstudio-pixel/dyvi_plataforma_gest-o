const TZ = "Europe/Lisbon";

export function fmtDate(iso: string | null, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-PT", { timeZone: TZ, ...opts }).format(new Date(iso));
}

export function fmtTime(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-PT", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function fmtWeekday(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", { timeZone: TZ, weekday: "short", day: "2-digit", month: "short" }).format(new Date(iso));
}

// Partes de data em hora de Lisboa
export function lisbonParts(iso: string) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return { date: `${g("year")}-${g("month")}-${g("day")}`, time: `${g("hour") === "24" ? "00" : g("hour")}:${g("minute")}` };
}

export function todayLisbon() {
  return lisbonParts(new Date().toISOString()).date;
}

export function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Segunda feira da semana da data
export function weekStart(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return addDays(date, -dow);
}

export function monthLabel(ym: string) {
  const d = new Date(`${ym}-01T12:00:00Z`);
  const s = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function shiftMonth(ym: string, n: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

// Intervalo UTC aproximado (com margem) para consultas de um período em Lisboa
export function rangeIso(fromDate: string, toDateExclusive: string) {
  return { from: `${addDays(fromDate, -1)}T00:00:00Z`, to: `${addDays(toDateExclusive, 1)}T00:00:00Z` };
}
