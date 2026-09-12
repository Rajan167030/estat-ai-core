import type { ScrapedListing } from "./types";

function keyOf(l: Pick<ScrapedListing, "source" | "listingId">) {
  return `${l.source}:${l.listingId}`;
}

export interface ListingStore {
  upsertMany(listings: ScrapedListing[]): Promise<{ inserted: number; updated: number }>;
  list(filter?: { source?: string; city?: string }): Promise<ScrapedListing[]>;
}

class InMemoryListingStore implements ListingStore {
  private readonly byKey = new Map<string, ScrapedListing>();

  async upsertMany(listings: ScrapedListing[]) {
    let inserted = 0;
    let updated = 0;
    for (const l of listings) {
      const key = keyOf(l);
      if (this.byKey.has(key)) updated++;
      else inserted++;
      this.byKey.set(key, l);
    }
    return { inserted, updated };
  }

  async list(filter?: { source?: string; city?: string }) {
    let out = [...this.byKey.values()];
    if (filter?.source) out = out.filter((l) => l.source === filter.source);
    if (filter?.city) out = out.filter((l) => l.city === filter.city);
    return out;
  }
}

let singleton: ListingStore | undefined;

export function getDefaultListingStore(): ListingStore {
  singleton ??= new InMemoryListingStore();
  return singleton;
}
