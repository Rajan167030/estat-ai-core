/**
 * Real browser-driven scraper for state RERA "Registered Projects" listings.
 *
 * Why Playwright and not the fetch+cheerio adapters in src/server/scraper:
 * these portals are ASP.NET WebForms behind what looks like bot-detection —
 * replaying the postback with plain HTTP (curl/fetch) got rejected outright,
 * but a real browser (real TLS/JS/cookies) should get through like it would
 * for a normal visitor. Some pages may still show a CAPTCHA on first visit;
 * this script runs headed by default so you can solve it by hand once, then
 * it continues on its own.
 *
 * This does NOT know each site's actual results-table markup yet — nobody
 * has seen it render successfully. So instead of guessing column mappings
 * (and silently producing wrong data), it dumps whatever table it finds as
 * raw columns plus a full-page screenshot + HTML snapshot of the first
 * results page. Run it once per state, look at the screenshot/HTML, and the
 * column mapping into ScrapedProject can be added for real from there.
 *
 * Setup (one-time):
 *   bunx playwright install chromium
 *
 * Usage:
 *   bun run scripts/scrape-rera-live.ts <state-key> [--headless] [--max-pages=N]
 *   bun run scripts/scrape-rera-live.ts up-rera
 *   bun run scripts/scrape-rera-live.ts all
 *
 * State keys: up-rera, karnataka-rera, telangana-rera, gujarat-rera, tn-rera
 * (maharera isn't listed here — its homepage didn't respond at all when
 * this was written; worth retrying separately.)
 */
import { chromium, type Page } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { toCsv } from "../src/server/scraper/csv";

interface StateConfig {
  key: string;
  label: string;
  homepageUrl: string;
  /** Visible text of the nav link/button that opens the registered-projects listing. */
  registeredProjectsLinkText: string;
}

const STATES: StateConfig[] = [
  {
    key: "up-rera",
    label: "UP RERA",
    homepageUrl: "https://up-rera.in",
    registeredProjectsLinkText: "Registered Projects",
  },
  {
    key: "karnataka-rera",
    label: "Karnataka RERA",
    homepageUrl: "https://rera.karnataka.gov.in",
    registeredProjectsLinkText: "Registered Projects",
  },
  {
    key: "telangana-rera",
    label: "Telangana RERA",
    homepageUrl: "https://rera.telangana.gov.in",
    registeredProjectsLinkText: "Registered Projects",
  },
  {
    key: "gujarat-rera",
    label: "Gujarat RERA",
    homepageUrl: "https://gujrera.gujarat.gov.in",
    registeredProjectsLinkText: "Registered Projects",
  },
  {
    key: "tn-rera",
    label: "Tamil Nadu RERA",
    homepageUrl: "https://rera.tn.gov.in",
    registeredProjectsLinkText: "Registered Projects",
  },
];

const CAPTCHA_HINTS = ["captcha", "verify you are human", "i'm not a robot"];

async function pauseForManualStep(message: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await rl.question(`\n${message}\nPress Enter here once done...`);
  rl.close();
}

async function maybeHandleCaptcha(page: Page, label: string) {
  const bodyText = (
    await page
      .locator("body")
      .innerText()
      .catch(() => "")
  ).toLowerCase();
  const hasCaptchaImage =
    (await page.locator('img[src*="captcha" i], iframe[src*="captcha" i]').count()) > 0;
  if (hasCaptchaImage || CAPTCHA_HINTS.some((h) => bodyText.includes(h))) {
    await pauseForManualStep(
      `[${label}] Looks like a CAPTCHA is showing in the browser window. Solve it there.`,
    );
  }
}

/** Finds the table with the most rows on the page — a stand-in until each site's real grid id is confirmed. */
async function extractLargestTable(page: Page): Promise<string[][]> {
  return page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll("table"));
    let best: HTMLTableElement | null = null;
    let bestRowCount = 0;
    for (const t of tables) {
      const rowCount = t.querySelectorAll("tr").length;
      if (rowCount > bestRowCount) {
        best = t as HTMLTableElement;
        bestRowCount = rowCount;
      }
    }
    if (!best) return [];
    return Array.from(best.querySelectorAll("tr")).map((tr) =>
      Array.from(tr.querySelectorAll("th,td")).map((cell) => (cell.textContent ?? "").trim()),
    );
  });
}

/** Looks for a "Next"-style pagination control and clicks it. Returns false when there's nothing left to click. */
async function goToNextPage(page: Page): Promise<boolean> {
  const candidates = page.locator(
    'a:has-text("Next"), a:has-text(">"), input[value="Next"], a[id*="Next" i], a[id*="lnkNext" i]',
  );
  const count = await candidates.count();
  for (let i = 0; i < count; i++) {
    const el = candidates.nth(i);
    const disabled = await el.getAttribute("disabled");
    const cls = (await el.getAttribute("class")) ?? "";
    if (disabled || /disabled/i.test(cls)) continue;
    await el.click().catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    return true;
  }
  return false;
}

async function scrapeState(
  state: StateConfig,
  outDir: string,
  headless: boolean,
  maxPages: number,
) {
  console.log(`\n=== ${state.label} (${state.key}) ===`);
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  });

  try {
    await page.goto(state.homepageUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await maybeHandleCaptcha(page, state.label);

    const link = page.getByText(state.registeredProjectsLinkText, { exact: false }).first();
    if ((await link.count()) === 0) {
      console.warn(
        `  ! Couldn't find a "${state.registeredProjectsLinkText}" link on the homepage — check ${state.homepageUrl} by hand and update this script's config.`,
      );
      await page.screenshot({
        path: path.join(outDir, `${state.key}-homepage.png`),
        fullPage: true,
      });
      return;
    }

    await link.click();
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    await maybeHandleCaptcha(page, state.label);

    await page.screenshot({ path: path.join(outDir, `${state.key}-page1.png`), fullPage: true });
    await writeFile(path.join(outDir, `${state.key}-page1.html`), await page.content(), "utf-8");

    const allRows: string[][] = [];
    let pageNum = 1;
    while (pageNum <= maxPages) {
      const rows = await extractLargestTable(page);
      if (rows.length > 0) allRows.push(...rows);
      console.log(`  page ${pageNum}: ${rows.length} table rows (running total ${allRows.length})`);

      const hasNext = await goToNextPage(page);
      if (!hasNext) break;
      pageNum++;
    }

    if (allRows.length === 0) {
      console.warn(
        `  ! No table found after clicking "${state.registeredProjectsLinkText}". See ${state.key}-page1.png / .html to work out the real selector.`,
      );
      return;
    }

    const maxCols = Math.max(...allRows.map((r) => r.length));
    const asObjects = allRows.map((row) =>
      Object.fromEntries(Array.from({ length: maxCols }, (_, i) => [`col${i + 1}`, row[i] ?? ""])),
    );
    const csv = toCsv(asObjects);
    const csvPath = path.join(outDir, `${state.key}-raw.csv`);
    await writeFile(csvPath, csv, "utf-8");
    console.log(`  -> ${allRows.length} raw rows written to ${csvPath}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0];
  const headless = args.includes("--headless");
  const maxPagesArg = args.find((a) => a.startsWith("--max-pages="));
  const maxPages = maxPagesArg ? Number(maxPagesArg.split("=")[1]) : 50;

  if (!target) {
    console.error(
      "Usage: bun run scripts/scrape-rera-live.ts <state-key|all> [--headless] [--max-pages=N]",
    );
    console.error("State keys:", STATES.map((s) => s.key).join(", "));
    process.exit(1);
  }

  const outDir = path.resolve("exports/rera-live");
  await mkdir(outDir, { recursive: true });

  const targets = target === "all" ? STATES : STATES.filter((s) => s.key === target);
  if (targets.length === 0) {
    console.error(`Unknown state key: ${target}`);
    process.exit(1);
  }

  for (const state of targets) {
    await scrapeState(state, outDir, headless, maxPages);
  }
}

main().catch((err) => {
  console.error("Scrape failed:", err);
  process.exit(1);
});
