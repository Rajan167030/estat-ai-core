/**
 * Writes one CSV per listing-portal source (99acres, MagicBricks, ...).
 * These adapters are synthetic-only by design — see
 * src/server/scraper/listings/adapters/base.ts for why (ToS + bot-detection
 * on all five platforms) — every row here is fake data, flagged `synthetic`.
 *
 * Usage: bun run scripts/export-listings-csv.ts [outDir]
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { LISTING_ADAPTERS, LISTING_SOURCES } from "../src/server/scraper/listings/registry";
import { toCsv } from "../src/server/scraper/csv";
import type { ScrapedListing } from "../src/server/scraper/listings/types";

const COLUMNS: Array<keyof ScrapedListing> = [
  "source",
  "listingId",
  "title",
  "projectName",
  "city",
  "locality",
  "bhk",
  "areaSqft",
  "price",
  "pricePerSqft",
  "possessionStatus",
  "listingUrl",
  "scrapedAt",
  "synthetic",
];

async function main() {
  const outDir = path.resolve(process.argv[2] ?? "exports/listings");
  await mkdir(outDir, { recursive: true });

  console.log(`Writing CSVs to ${outDir}\n`);

  for (const meta of LISTING_SOURCES) {
    const adapter = LISTING_ADAPTERS[meta.key]!;
    const { listings, warnings } = await adapter.search({});
    const csv = toCsv(listings, COLUMNS);
    const file = path.join(outDir, `${meta.key}.csv`);
    await writeFile(file, csv, "utf-8");
    console.log(`- ${meta.label} (${meta.key}): ${listings.length} rows -> ${file}`);
    for (const w of warnings) console.log(`    ! ${w}`);
  }
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
