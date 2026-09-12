import type { ListingAdapter } from "./adapters/base";
import type { ListingStore } from "./store";
import type { ListingSearchParams, ScrapedListing } from "./types";

export interface ListingRunSummary {
  source: string;
  fetched: number;
  inserted: number;
  updated: number;
  mode: "live" | "stub";
  warnings: string[];
  sample: ScrapedListing[];
  ranAt: string;
}

export async function runListingScrape(
  adapter: ListingAdapter,
  store: ListingStore,
  params: ListingSearchParams = {},
): Promise<ListingRunSummary> {
  const { listings, mode, warnings } = await adapter.search(params);
  const { inserted, updated } = await store.upsertMany(listings);
  return {
    source: adapter.source,
    fetched: listings.length,
    inserted,
    updated,
    mode,
    warnings,
    sample: listings.slice(0, 5),
    ranAt: new Date().toISOString(),
  };
}
