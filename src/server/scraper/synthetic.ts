import type { RegistrationStatus, ScrapedProject } from "./types";

/**
 * Generates realistic-looking (but entirely fake) RERA project rows so the
 * app has enough volume to build/demo against while real scraping is
 * blocked (see adapters/maharera.ts and scripts/scrape-rera-live.ts for
 * why). Every row is stamped `synthetic: true` — never treat this as a real
 * registration record, and never strip that flag before it reaches a UI or
 * export a real user might mistake for authoritative RERA data.
 */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PROMOTER_NAMES = [
  "Horizon",
  "Kalpataru",
  "Nishant",
  "Ashiana",
  "Prestige",
  "My Home",
  "Shivalik",
  "Casagrand",
  "Sunrise",
  "Silverline",
  "Greenfield",
  "Vasavi",
  "Brigade",
  "Sobha",
  "Purva",
  "Godrej",
  "Mahindra",
  "Shriram",
  "Rustomjee",
  "Runwal",
  "Lodha",
  "Kolte-Patil",
  "Puravankara",
  "Rohan",
];
const PROMOTER_SUFFIXES = [
  "Constructions",
  "Realty",
  "Infra Pvt Ltd",
  "Developers",
  "Estates",
  "Properties Pvt Ltd",
  "Builders",
  "Group",
  "Devcon Pvt Ltd",
  "Infrahomes Pvt Ltd",
];

const PROJECT_PREFIXES = [
  "Sunrise",
  "Willow",
  "Riverside",
  "Green",
  "Silver",
  "Golden",
  "Royal",
  "Elite",
  "Orchid",
  "Palm",
  "Emerald",
  "Sapphire",
  "Crystal",
  "Maple",
  "Cedar",
  "Lotus",
  "Jasmine",
  "Amber",
];
const PROJECT_SUFFIXES = [
  "Meadows",
  "Residency",
  "Heights",
  "Enclave",
  "Greens",
  "County",
  "Woods",
  "Vista",
  "Gardens",
  "Palazzo",
  "Court",
  "Towers",
  "Park",
  "Orchards",
  "Bhooja Extension",
  "Utopia",
  "Casa",
];

const REGISTRATION_STATUSES: RegistrationStatus[] = [
  "Registered",
  "Registered",
  "Registered",
  "Extended",
  "Lapsed",
];

function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)]!;
}
function int(rnd: () => number, min: number, max: number): number {
  return min + Math.floor(rnd() * (max - min + 1));
}
function isoDate(rnd: () => number, startYear: number, endYear: number): string {
  const year = int(rnd, startYear, endYear);
  const month = int(rnd, 1, 12);
  const day = int(rnd, 1, 28);
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

export interface SyntheticReraConfig {
  source: string;
  districts: string[];
  count: number;
  /** Builds this source's real registration-number format, e.g. MahaRERA's "P51700000123". */
  reraNumber: (rnd: () => number, index: number, district: string) => string;
}

export function generateSyntheticProjects(config: SyntheticReraConfig): ScrapedProject[] {
  const rnd = mulberry32(hashSeed(config.source));
  const now = new Date().toISOString();

  return Array.from({ length: config.count }, (_, i) => {
    const district = pick(rnd, config.districts);
    const status = pick(rnd, REGISTRATION_STATUSES);
    const reraNumber = config.reraNumber(rnd, i, district);
    const totalUnits = int(rnd, 40, 800);
    const approvedDate = isoDate(rnd, 2018, 2025);
    const proposedCompletionDate = isoDate(rnd, 2025, 2030);

    const project: ScrapedProject = {
      source: config.source,
      sourceId: reraNumber,
      reraNumber,
      projectName: `${pick(rnd, PROJECT_PREFIXES)} ${pick(rnd, PROJECT_SUFFIXES)}`,
      promoterName: `${pick(rnd, PROMOTER_NAMES)} ${pick(rnd, PROMOTER_SUFFIXES)}`,
      district,
      reraType: pick(rnd, ["New", "Ongoing", "Ongoing", "Ongoing"] as const),
      approvedDate,
      proposedCompletionDate,
      status,
      totalUnits,
      bookedUnits: int(rnd, 0, totalUnits),
      litigationCount: rnd() < 0.08 ? int(rnd, 1, 3) : 0,
      scrapedAt: now,
      synthetic: true,
    };
    if (status === "Extended") project.extendedCompletionDate = isoDate(rnd, 2025, 2028);
    return project;
  });
}
