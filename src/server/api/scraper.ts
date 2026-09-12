import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { RERA_ADAPTERS, RERA_SOURCES } from "../scraper/registry";
import { getDefaultScraperStore } from "../scraper/store";
import { runScrape } from "../scraper/pipeline";
import { LISTING_ADAPTERS, LISTING_SOURCES } from "../scraper/listings/registry";
import { getDefaultListingStore } from "../scraper/listings/store";
import { runListingScrape } from "../scraper/listings/pipeline";

export const getScrapeSources = createServerFn({ method: "GET" }).handler(async () => ({
  rera: RERA_SOURCES,
  listings: LISTING_SOURCES,
}));

export const runReraScrape = createServerFn({ method: "POST" })
  .validator(z.object({ source: z.string() }))
  .handler(async ({ data }) => {
    const adapter = RERA_ADAPTERS[data.source];
    if (!adapter) throw new Error(`Unknown RERA source: ${data.source}`);
    return runScrape(adapter, getDefaultScraperStore());
  });

export const runAllReraScrapes = createServerFn({ method: "POST" }).handler(async () => {
  const store = getDefaultScraperStore();
  const results = [];
  for (const adapter of Object.values(RERA_ADAPTERS)) {
    results.push(await runScrape(adapter, store));
  }
  return results;
});

export const listScrapedProjects = createServerFn({ method: "GET" })
  .validator(z.object({ source: z.string().optional() }).optional())
  .handler(async ({ data }) =>
    getDefaultScraperStore().list(data?.source ? { source: data.source } : undefined),
  );

export const runListingScrapeFn = createServerFn({ method: "POST" })
  .validator(z.object({ source: z.string() }))
  .handler(async ({ data }) => {
    const adapter = LISTING_ADAPTERS[data.source];
    if (!adapter) throw new Error(`Unknown listing source: ${data.source}`);
    return runListingScrape(adapter, getDefaultListingStore());
  });

export const runAllListingScrapes = createServerFn({ method: "POST" }).handler(async () => {
  const store = getDefaultListingStore();
  const results = [];
  for (const adapter of Object.values(LISTING_ADAPTERS)) {
    results.push(await runListingScrape(adapter, store));
  }
  return results;
});

export const listScrapedListings = createServerFn({ method: "GET" })
  .validator(z.object({ source: z.string().optional() }).optional())
  .handler(async ({ data }) =>
    getDefaultListingStore().list(data?.source ? { source: data.source } : undefined),
  );
