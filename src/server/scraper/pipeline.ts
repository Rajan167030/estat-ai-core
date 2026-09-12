import type { RERAAdapter } from "./adapters/base";
import type { ScraperStore } from "./store";
import type { RERASearchParams, ScrapeRunSummary } from "./types";
import { dedupe, normalizeProject } from "./normalize";

export async function runScrape(
  adapter: RERAAdapter,
  store: ScraperStore,
  params: RERASearchParams = {},
): Promise<ScrapeRunSummary> {
  const { projects: raw, mode, warnings } = await adapter.search(params);
  const normalized = dedupe(raw.map(normalizeProject));
  const { inserted, updated } = await store.upsertMany(normalized);

  return {
    source: adapter.source,
    fetched: raw.length,
    inserted,
    updated,
    mode,
    warnings,
    sample: normalized.slice(0, 5),
    ranAt: new Date().toISOString(),
  };
}
