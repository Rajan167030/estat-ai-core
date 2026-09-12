function escapeCsvCell(value: unknown): string {
  if (value === undefined || value === null) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Flattens an array of flat objects into CSV text, columns taken from the first row's keys (or an explicit list). */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns?: Array<keyof T>,
): string {
  if (rows.length === 0) return "";
  const cols = columns ?? (Object.keys(rows[0]!) as Array<keyof T>);
  const header = cols.map((c) => escapeCsvCell(String(c))).join(",");
  const lines = rows.map((row) => cols.map((c) => escapeCsvCell(row[c])).join(","));
  return [header, ...lines].join("\n") + "\n";
}
