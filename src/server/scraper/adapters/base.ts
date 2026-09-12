import type { RERASearchParams, ScrapedProject } from "../types";

export interface RERAAdapter {
  readonly source: string;
  /**
   * Fetch + parse projects for the given filters.
   * `mode` tells the caller whether real HTTP/parsing happened ("live") or
   * a bundled fixture was returned because live access isn't wired up yet ("stub").
   */
  search(
    params: RERASearchParams,
  ): Promise<{ projects: ScrapedProject[]; mode: "live" | "stub"; warnings: string[] }>;
}
