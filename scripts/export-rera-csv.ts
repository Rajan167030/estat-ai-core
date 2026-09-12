/**
 * Runs every registered state-RERA adapter and writes one CSV per state.
 *
 * Right now every adapter (bar MahaRERA's live-fetch attempt) returns its
 * bundled stub fixture — see src/server/scraper/adapters — because live
 * scraping each state's actual government portal needs that portal's real
 * search-page contract (session tokens, sometimes a CAPTCHA) captured by
 * hand first. Run this again after wiring a state's live parser and its CSV
 * picks up real rows automatically — nothing else here changes.
 *
 * Usage: bun run scripts/export-rera-csv.ts [outDir]
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { RERA_ADAPTERS, RERA_SOURCES } from "../src/server/scraper/registry";
import { toCsv } from "../src/server/scraper/csv";
import type { ScrapedProject } from "../src/server/scraper/types";

const COLUMNS: Array<keyof ScrapedProject> = [
  "source",
  "reraNumber",
  "projectName",
  "promoterName",
  "promoterAddress",
  "district",
  "taluka",
  "reraType",
  "approvedDate",
  "proposedCompletionDate",
  "extendedCompletionDate",
  "status",
  "totalUnits",
  "bookedUnits",
  "litigationCount",
  "websiteUrl",
  "scrapedAt",
  "synthetic",
];

async function main() {
  const outDir = path.resolve(process.argv[2] ?? "exports/rera");
  await mkdir(outDir, { recursive: true });

  console.log(`Writing CSVs to ${outDir}\n`);

  for (const meta of RERA_SOURCES) {
    const adapter = RERA_ADAPTERS[meta.key]!;
    const { projects, mode, warnings } = await adapter.search({});
    const csv = toCsv(projects, COLUMNS);
    const file = path.join(outDir, `${meta.key}.csv`);
    await writeFile(file, csv, "utf-8");
    console.log(`- ${meta.label} (${meta.key}): ${projects.length} rows, mode=${mode} -> ${file}`);
    for (const w of warnings) console.log(`    ! ${w}`);
  }
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
