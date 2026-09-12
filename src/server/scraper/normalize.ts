import type { ScrapedProject } from "./types";

export function keyOf(p: Pick<ScrapedProject, "source" | "sourceId">) {
  return `${p.source}:${p.sourceId}`;
}

/** Trims text fields and re-derives status when an extension date has quietly lapsed. */
export function normalizeProject(p: ScrapedProject): ScrapedProject {
  const now = Date.now();
  let status = p.status;
  if (
    status === "Extended" &&
    p.extendedCompletionDate &&
    new Date(p.extendedCompletionDate).getTime() < now
  ) {
    status = "Lapsed";
  }
  return {
    ...p,
    projectName: p.projectName.trim(),
    promoterName: p.promoterName.trim(),
    district: p.district.trim(),
    status,
  };
}

export function dedupe(projects: ScrapedProject[]): ScrapedProject[] {
  const byKey = new Map<string, ScrapedProject>();
  for (const p of projects) byKey.set(keyOf(p), p);
  return [...byKey.values()];
}
