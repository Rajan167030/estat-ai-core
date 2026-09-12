import * as cheerio from "cheerio";
import type { RERAAdapter } from "./base";
import type { RERASearchParams, ScrapedProject } from "../types";
import { generateSyntheticProjects } from "../synthetic";

/**
 * MahaRERA (https://maharera.mahaonline.gov.in) is an ASP.NET WebForms site:
 * its project-search page needs a live __VIEWSTATE/__EVENTVALIDATION pair
 * pulled from a fresh GET before you can POST a search, and it fronts
 * results with a CAPTCHA on some flows. That can't be reverse-engineered
 * blind — it needs a browser session against the real site to capture the
 * current form contract, then real selectors dropped in below.
 *
 * So this adapter is wired for both modes:
 *  - MAHARERA_LIVE=1  → does the real GET+parse against MAHARERA_BASE_URL
 *    (defaults to the production host). Until the WebForms handshake above
 *    is implemented this will typically hit `warnings` and fall back to stub.
 *  - default          → returns a small fixture sample shaped exactly like
 *    the live parser's output, so the rest of the pipeline (normalize,
 *    dedupe, store, UI) can be built and tested today.
 */

const DEFAULT_BASE_URL = "https://maharera.mahaonline.gov.in";

const MAHARASHTRA_DISTRICTS = [
  "Pune",
  "Mumbai Suburban",
  "Mumbai City",
  "Thane",
  "Nagpur",
  "Nashik",
  "Pimpri-Chinchwad",
  "Aurangabad",
];

const FIXTURE_SAMPLE: ScrapedProject[] = generateSyntheticProjects({
  source: "maharera",
  districts: MAHARASHTRA_DISTRICTS,
  count: 400,
  reraNumber: (rnd, i) => `P5${String(Math.floor(rnd() * 90) + 10)}${String(i).padStart(8, "0")}`,
});

function parseSearchResultsHtml(html: string): ScrapedProject[] {
  // Placeholder parser: once the real search response shape is captured
  // (table id / row structure), replace the selectors below. Cheerio is
  // already wired up so this is the only function that needs to change.
  const $ = cheerio.load(html);
  const rows: ScrapedProject[] = [];
  $("table#projectSearchResults tbody tr").each((_, el) => {
    const cells = $(el)
      .find("td")
      .map((__, td) => $(td).text().trim())
      .get();
    if (cells.length < 5) return;
    const [reraNumber, projectName, promoterName, district, status] = cells;
    rows.push({
      source: "maharera",
      sourceId: reraNumber!,
      reraNumber: reraNumber!,
      projectName: projectName!,
      promoterName: promoterName!,
      district: district!,
      reraType: "NA",
      status: (status as ScrapedProject["status"]) ?? "Not Registered",
      scrapedAt: new Date().toISOString(),
    });
  });
  return rows;
}

export class MahaReraAdapter implements RERAAdapter {
  readonly source = "maharera";

  constructor(
    private readonly baseUrl: string = process.env["MAHARERA_BASE_URL"] ?? DEFAULT_BASE_URL,
    private readonly liveMode: boolean = process.env["MAHARERA_LIVE"] === "1",
  ) {}

  async search(params: RERASearchParams) {
    const warnings: string[] = [];

    if (this.liveMode) {
      try {
        const url = new URL("/PRRERA/RegisteredProjectsSearchList", this.baseUrl);
        if (params.district) url.searchParams.set("district", params.district);
        if (params.query) url.searchParams.set("q", params.query);
        const res = await fetch(url, { headers: { "user-agent": "estatum-scraper/1.0" } });
        if (!res.ok) throw new Error(`MahaRERA responded ${res.status}`);
        const html = await res.text();
        const projects = parseSearchResultsHtml(html);
        if (projects.length === 0) {
          warnings.push(
            "Live fetch succeeded but parsed 0 rows — the WebForms selectors in maharera.ts likely need updating against the current page markup.",
          );
          return { projects: FIXTURE_SAMPLE, mode: "stub" as const, warnings };
        }
        return { projects, mode: "live" as const, warnings };
      } catch (err) {
        warnings.push(
          `Live MahaRERA fetch failed, falling back to stub sample: ${err instanceof Error ? err.message : String(err)}`,
        );
        return { projects: FIXTURE_SAMPLE, mode: "stub" as const, warnings };
      }
    }

    warnings.push(
      "MAHARERA_LIVE is not set — returning bundled fixture sample instead of hitting the live portal.",
    );
    return { projects: FIXTURE_SAMPLE, mode: "stub" as const, warnings };
  }
}
