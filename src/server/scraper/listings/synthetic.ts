import type { ScrapedListing } from "./types";

/**
 * Generates realistic-looking (but entirely fake) property listings.
 * Every row is stamped `synthetic: true` — see src/server/scraper/synthetic.ts
 * for why: these five portals ban scraping in their ToS, so this is what
 * stands in for real inventory until a partner-API integration exists.
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
function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)]!;
}
function int(rnd: () => number, min: number, max: number): number {
  return min + Math.floor(rnd() * (max - min + 1));
}

const CITY_LOCALITIES: Record<
  string,
  { localities: string[]; pricePerSqftRange: [number, number] }
> = {
  Mumbai: {
    localities: ["Andheri East", "Powai", "Malad", "Thane West", "Chembur"],
    pricePerSqftRange: [14000, 32000],
  },
  Bengaluru: {
    localities: ["Whitefield", "Sarjapur Road", "Electronic City", "Hebbal", "Marathahalli"],
    pricePerSqftRange: [6000, 13000],
  },
  Pune: {
    localities: ["Kharadi", "Baner", "Wakad", "Hinjewadi", "Viman Nagar"],
    pricePerSqftRange: [5500, 11000],
  },
  Hyderabad: {
    localities: ["Gachibowli", "Kondapur", "Kukatpally", "Miyapur", "Ranga Reddy"],
    pricePerSqftRange: [4800, 9500],
  },
  Chennai: {
    localities: ["OMR", "Velachery", "Porur", "Anna Nagar", "Tambaram"],
    pricePerSqftRange: [5000, 10500],
  },
  Ahmedabad: {
    localities: ["Bopal", "Satellite", "Prahlad Nagar", "SG Highway"],
    pricePerSqftRange: [3800, 7500],
  },
  Noida: {
    localities: ["Sector 150", "Noida Extension", "Sector 62", "Greater Noida West"],
    pricePerSqftRange: [4500, 9000],
  },
};

const BHK_OPTIONS = ["1 BHK", "2 BHK", "3 BHK", "4 BHK"] as const;
const AREA_BY_BHK: Record<(typeof BHK_OPTIONS)[number], [number, number]> = {
  "1 BHK": [450, 650],
  "2 BHK": [750, 1150],
  "3 BHK": [1150, 1700],
  "4 BHK": [1800, 2600],
};
const POSSESSION_STATUSES = ["Ready to move", "Under construction", "New launch"] as const;

const PROJECT_PREFIXES = [
  "Sunrise",
  "Willow",
  "Riverside",
  "Green",
  "Silver",
  "Golden",
  "Elite",
  "Orchid",
  "Palm",
  "Emerald",
];
const PROJECT_SUFFIXES = [
  "Meadows",
  "Residency",
  "Heights",
  "Enclave",
  "Greens",
  "Court",
  "Towers",
  "Park",
];

export interface SyntheticListingConfig {
  source: string;
  count: number;
}

export function generateSyntheticListings(config: SyntheticListingConfig): ScrapedListing[] {
  const rnd = mulberry32(hashSeed(config.source));
  const now = new Date().toISOString();
  const cities = Object.keys(CITY_LOCALITIES);

  return Array.from({ length: config.count }, (_, i) => {
    const city = pick(rnd, cities)!;
    const cityCfg = CITY_LOCALITIES[city]!;
    const locality = pick(rnd, cityCfg.localities);
    const bhk = pick(rnd, BHK_OPTIONS);
    const [minArea, maxArea] = AREA_BY_BHK[bhk];
    const areaSqft = int(rnd, minArea, maxArea);
    const [minPsf, maxPsf] = cityCfg.pricePerSqftRange;
    const pricePerSqft = int(rnd, minPsf, maxPsf);
    const projectName = `${pick(rnd, PROJECT_PREFIXES)} ${pick(rnd, PROJECT_SUFFIXES)}`;
    const listingId = `${config.source.toUpperCase()}-${1000000 + i}`;

    const listing: ScrapedListing = {
      source: config.source,
      listingId,
      title: `${bhk} ${bhk === "1 BHK" ? "Apartment" : "Flat"} for sale in ${locality}, ${city}`,
      projectName,
      city,
      locality,
      bhk,
      areaSqft,
      price: areaSqft * pricePerSqft,
      pricePerSqft,
      possessionStatus: pick(rnd, POSSESSION_STATUSES),
      listingUrl: `https://example-listing.invalid/${config.source}/${listingId}`,
      scrapedAt: now,
      synthetic: true,
    };
    return listing;
  });
}
