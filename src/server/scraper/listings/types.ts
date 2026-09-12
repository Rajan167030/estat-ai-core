/**
 * Schema for commercial listing-portal data (99acres, MagicBricks, Housing.com, ...).
 * Kept separate from ScrapedProject (RERA schema) because the data shape is
 * genuinely different — this is priced inventory, not a registration record.
 */
export interface ScrapedListing {
  source: string;
  listingId: string;
  title: string;
  projectName?: string;
  city: string;
  locality: string;
  bhk?: string;
  areaSqft?: number;
  price?: number;
  pricePerSqft?: number;
  possessionStatus?: "Ready to move" | "Under construction" | "New launch";
  listingUrl: string;
  postedAt?: string;
  scrapedAt: string;
  /** true when this row is generated test data, not a real scraped listing. Never omit/strip this on synthetic rows. */
  synthetic?: boolean;
}

export interface ListingSearchParams {
  city?: string;
  query?: string;
  page?: number;
}
