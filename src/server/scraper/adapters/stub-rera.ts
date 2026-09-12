import type { RERAAdapter } from "./base";
import type { RERASearchParams, ScrapedProject } from "../types";

/**
 * Every state RERA portal is a different government site (different tech
 * stack, different anti-bot posture, several behind a WebForms
 * viewstate+CAPTCHA like MahaRERA — see maharera.ts for the live-fetch
 * approach). Rather than fake "live" parsing per state without ever having
 * inspected the real markup, each of these ships as a stub that returns a
 * realistic fixture sample under the real adapter interface — swap the
 * `search` body for a real fetch+parse once someone captures that state's
 * actual search-page contract.
 */
export class StubReraAdapter implements RERAAdapter {
  readonly source: string;
  private readonly fixture: ScrapedProject[];
  readonly homepageUrl: string;
  readonly label: string;

  constructor(opts: {
    source: string;
    label: string;
    homepageUrl: string;
    fixture: ScrapedProject[];
  }) {
    this.source = opts.source;
    this.label = opts.label;
    this.homepageUrl = opts.homepageUrl;
    this.fixture = opts.fixture;
  }

  async search(_params: RERASearchParams) {
    return {
      projects: this.fixture,
      mode: "stub" as const,
      warnings: [
        `${this.label} has no live parser wired up yet — see ${this.homepageUrl} to capture its real search-page contract.`,
      ],
    };
  }
}
