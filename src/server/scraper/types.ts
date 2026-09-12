/**
 * Common schema every RERA/listing-portal adapter normalizes into.
 * Downstream code (store, pipeline, UI) only ever sees this shape —
 * adding a new source means writing an adapter, not touching consumers.
 */

export type RegistrationStatus =
  "Registered" | "Extended" | "Lapsed" | "Revoked" | "Not Registered";

export interface ScrapedProject {
  /** Adapter key, e.g. "maharera" — forms the composite primary key with sourceId. */
  source: string;
  /** Source's own primary key (registration number, listing id, ...). */
  sourceId: string;
  reraNumber: string;
  projectName: string;
  promoterName: string;
  promoterAddress?: string;
  district: string;
  taluka?: string;
  reraType: "New" | "Ongoing" | "NA";
  approvedDate?: string;
  proposedCompletionDate?: string;
  extendedCompletionDate?: string;
  status: RegistrationStatus;
  totalUnits?: number;
  bookedUnits?: number;
  litigationCount?: number;
  websiteUrl?: string;
  /** When this record was fetched — drives the "freshness" / staleness view. */
  scrapedAt: string;
  /** true when this row is generated test data, not a real scraped registration. Never omit/strip this on synthetic rows. */
  synthetic?: boolean;
}

export interface RERASearchParams {
  district?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

export interface ScrapeRunSummary {
  source: string;
  fetched: number;
  inserted: number;
  updated: number;
  mode: "live" | "stub";
  warnings: string[];
  sample: ScrapedProject[];
  ranAt: string;
}
