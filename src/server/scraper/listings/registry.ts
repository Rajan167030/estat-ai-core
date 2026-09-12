import { StubListingAdapter, type ListingAdapter } from "./adapters/base";
import { generateSyntheticListings } from "./synthetic";

const acres99 = new StubListingAdapter({
  source: "99acres",
  label: "99acres",
  homepageUrl: "https://www.99acres.com",
  fixture: generateSyntheticListings({ source: "99acres", count: 200 }),
});

const magicbricks = new StubListingAdapter({
  source: "magicbricks",
  label: "MagicBricks",
  homepageUrl: "https://www.magicbricks.com",
  fixture: generateSyntheticListings({ source: "magicbricks", count: 200 }),
});

const housing = new StubListingAdapter({
  source: "housing",
  label: "Housing.com",
  homepageUrl: "https://housing.com",
  fixture: generateSyntheticListings({ source: "housing", count: 180 }),
});

const nobroker = new StubListingAdapter({
  source: "nobroker",
  label: "NoBroker",
  homepageUrl: "https://www.nobroker.in",
  fixture: generateSyntheticListings({ source: "nobroker", count: 150 }),
});

const squareyards = new StubListingAdapter({
  source: "squareyards",
  label: "Square Yards",
  homepageUrl: "https://www.squareyards.com",
  fixture: generateSyntheticListings({ source: "squareyards", count: 150 }),
});

export const LISTING_ADAPTERS: Record<string, ListingAdapter> = Object.fromEntries(
  [acres99, magicbricks, housing, nobroker, squareyards].map((a) => [a.source, a]),
);

export const LISTING_SOURCES = [acres99, magicbricks, housing, nobroker, squareyards].map((a) => ({
  key: a.source,
  label: a.label,
  homepageUrl: a.homepageUrl,
}));
