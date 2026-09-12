import type { ListingSearchParams, ScrapedListing } from "../types";

export interface ListingAdapter {
  readonly source: string;
  readonly label: string;
  readonly homepageUrl: string;
  search(
    params: ListingSearchParams,
  ): Promise<{ listings: ScrapedListing[]; mode: "live" | "stub"; warnings: string[] }>;
}

/**
 * 99acres, MagicBricks, Housing.com, NoBroker and Square Yards all
 * explicitly prohibit automated scraping in their Terms of Use and run
 * active bot-detection (Cloudflare/Akamai challenges, rate-limited
 * CAPTCHAs, session fingerprinting). Building a scraper that fights that
 * detection is a ToS-violation / detection-evasion exercise, not a normal
 * integration — this repo won't do that.
 *
 * What's actually reliable for these five: their official channel-partner /
 * broker APIs and data-feed programs, which each platform offers for
 * exactly this "get structured listing data" use case:
 *   - 99acres:      https://www.99acres.com/  (Partner/Channel Partner API — apply via their business team)
 *   - MagicBricks:  https://www.magicbricks.com/  (Data Services / API partnership)
 *   - Housing.com:  https://housing.com/  (Broker/Partner API)
 *   - NoBroker:     https://www.nobroker.in/  (Partner integrations)
 *   - Square Yards: https://www.squareyards.com/  (Channel partner data feed)
 *
 * Each adapter below implements the same ListingAdapter interface as a
 * true integration would, but returns a fixture sample — so the
 * normalize/dedupe/store/UI pipeline is real and testable today, and
 * swapping in a real call is a one-file change once you have a partner API
 * key from that platform.
 */
export class StubListingAdapter implements ListingAdapter {
  readonly source: string;
  readonly label: string;
  readonly homepageUrl: string;
  private readonly fixture: ScrapedListing[];

  constructor(opts: {
    source: string;
    label: string;
    homepageUrl: string;
    fixture: ScrapedListing[];
  }) {
    this.source = opts.source;
    this.label = opts.label;
    this.homepageUrl = opts.homepageUrl;
    this.fixture = opts.fixture;
  }

  async search(_params: ListingSearchParams) {
    return {
      listings: this.fixture,
      mode: "stub" as const,
      warnings: [
        `${this.label} has no live connector — their ToS blocks scraping. Use their partner/data-feed API (see ${this.homepageUrl}) and drop the real call into this adapter's search().`,
      ],
    };
  }
}
