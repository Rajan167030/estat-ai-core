export function inr(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value.toFixed(0)}`;
}

export function inrFull(value: number): string {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
}

export function num(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function pct(value: number, digits = 1): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export function relativeDays(iso: string, from = new Date("2026-09-02T00:00:00Z")): string {
  const diff = Math.round((new Date(iso).getTime() - from.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return diff > 0 ? `in ${diff}d` : `${Math.abs(diff)}d ago`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
