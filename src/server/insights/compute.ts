import { TODAY, leads, bookings, payments, units, projects, projectName } from "@/lib/mock/data";
import { getDefaultListingStore } from "../scraper/listings/store";

function daysSince(iso: string): number {
  return Math.floor((TODAY.getTime() - new Date(iso).getTime()) / 86_400_000);
}

/** Real facts for the "Lead Intelligence" category — computed from the actual leads dataset, not invented. */
export function computeLeadDecayFacts() {
  const hotWarm = leads.filter((l) => l.status === "Hot" || l.status === "Warm");
  const decaying = hotWarm.filter((l) => daysSince(l.lastActivity) >= 5);
  const avgScore = Math.round(
    decaying.reduce((s, l) => s + l.score, 0) / Math.max(decaying.length, 1),
  );
  const topNames = [...decaying]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((l) => l.name);

  return {
    hotWarmCount: hotWarm.length,
    decayingCount: decaying.length,
    decayingPct: Math.round((decaying.length / Math.max(hotWarm.length, 1)) * 100),
    avgScoreOfDecaying: avgScore,
    topAtRiskLeads: topNames,
    avgSiteVisits: Number(
      (decaying.reduce((s, l) => s + l.siteVisits, 0) / Math.max(decaying.length, 1)).toFixed(1),
    ),
  };
}

/** Real facts for "Collection Risk" — from the actual payments dataset. */
export function computeCollectionRiskFacts() {
  // delayProbability is already a 0-100 integer (see mock/data.ts), not a 0-1 fraction.
  const atRisk = payments.filter((p) => p.status === "Overdue" || p.delayProbability >= 60);
  const totalAtRisk = atRisk.reduce((s, p) => s + (p.due - p.paid), 0);
  const avgDelayProbability = Math.round(
    atRisk.reduce((s, p) => s + p.delayProbability, 0) / Math.max(atRisk.length, 1),
  );
  const byProject = new Map<string, number>();
  for (const p of atRisk)
    byProject.set(p.projectId, (byProject.get(p.projectId) ?? 0) + (p.due - p.paid));
  const topProjects = [...byProject.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, amt]) => ({ project: projectName(id), amount: amt }));

  return {
    milestonesAtRisk: atRisk.length,
    totalAmountAtRisk: totalAtRisk,
    avgDelayProbabilityPct: avgDelayProbability,
    topExposureProjects: topProjects,
  };
}

/** Real facts for "Pricing Intelligence" — own inventory vs scraped market listings (see src/server/scraper/listings). */
export async function computePricingFacts() {
  const byProject = new Map<
    string,
    { total: number; available: number; sumPsf: number; count: number; city: string }
  >();
  for (const u of units) {
    const proj = projects.find((p) => p.id === u.projectId);
    if (!proj) continue;
    const entry = byProject.get(u.projectId) ?? {
      total: 0,
      available: 0,
      sumPsf: 0,
      count: 0,
      city: proj.city,
    };
    entry.total += 1;
    if (u.status === "Available") entry.available += 1;
    entry.sumPsf += u.price / Math.max(u.saleable, 1);
    entry.count += 1;
    byProject.set(u.projectId, entry);
  }

  const listingStore = getDefaultListingStore();
  const listings = await listingStore.list();

  const rows = [...byProject.entries()].map(([id, e]) => {
    const ownPsf = Math.round(e.sumPsf / Math.max(e.count, 1));
    const marketListings = listings.filter((l) => l.city === e.city);
    const marketPsf = marketListings.length
      ? Math.round(
          marketListings.reduce((s, l) => s + (l.pricePerSqft ?? 0), 0) / marketListings.length,
        )
      : undefined;
    return {
      project: projectName(id),
      city: e.city,
      ownPricePerSqft: ownPsf,
      marketPricePerSqft: marketPsf,
      availablePct: Math.round((e.available / Math.max(e.total, 1)) * 100),
    };
  });

  // Most interesting case: biggest gap between own pricing and market, with tight availability (high demand signal).
  const withGap = rows
    .filter((r) => r.marketPricePerSqft)
    .map((r) => ({
      ...r,
      gapPct: Math.round(((r.marketPricePerSqft! - r.ownPricePerSqft) / r.ownPricePerSqft) * 100),
    }))
    .sort((a, b) => Math.abs(b.gapPct) - Math.abs(a.gapPct));

  return { projects: rows, mostSignificant: withGap[0] };
}

/** Real facts for "Sales Forecast" — booking velocity trend over the actual bookings dataset. */
export function computeSalesForecastFacts() {
  const byMonth = new Map<string, { count: number; value: number }>();
  for (const b of bookings) {
    const key = b.date.slice(0, 7);
    const entry = byMonth.get(key) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += b.amount;
    byMonth.set(key, entry);
  }
  // Drop the current month — it's still in progress partway through, so its
  // count is naturally low and would wreck the trend if compared as-is.
  const currentMonthKey = TODAY.toISOString().slice(0, 7);
  const completedMonths = [...byMonth.entries()]
    .filter(([key]) => key !== currentMonthKey)
    .sort(([a], [b]) => a.localeCompare(b));
  const recent = completedMonths.slice(-4);
  const counts = recent.map(([, v]) => v.count);
  const trendPct =
    counts.length >= 2
      ? Math.round(((counts.at(-1)! - counts[0]!) / Math.max(counts[0]!, 1)) * 100)
      : 0;
  const avgMonthlyValue = Math.round(
    recent.reduce((s, [, v]) => s + v.value, 0) / Math.max(recent.length, 1),
  );

  return {
    recentMonths: recent.map(([month, v]) => ({ month, bookings: v.count, value: v.value })),
    trendPct,
    avgMonthlyValue,
    totalBookingsAllTime: bookings.length,
  };
}

/** Real facts for "Anomaly Detection" — z-score-style outliers over executive discount/conversion behaviour. */
export function computeAnomalyFacts() {
  const byExecutive = new Map<string, { discountSum: number; count: number }>();
  for (const b of bookings) {
    const e = byExecutive.get(b.executive) ?? { discountSum: 0, count: 0 };
    e.discountSum += b.discount;
    e.count += 1;
    byExecutive.set(b.executive, e);
  }
  const avgDiscounts = [...byExecutive.entries()].map(([exec, v]) => ({
    exec,
    avgDiscount: v.discountSum / v.count,
    count: v.count,
  }));
  const overallAvg =
    avgDiscounts.reduce((s, e) => s + e.avgDiscount, 0) / Math.max(avgDiscounts.length, 1);
  const outliers = avgDiscounts
    .filter((e) => e.count >= 2 && e.avgDiscount > overallAvg * 2)
    .sort((a, b) => b.avgDiscount - a.avgDiscount);

  return {
    overallAvgDiscount: Math.round(overallAvg),
    outlierExecutives: outliers.slice(0, 3).map((o) => ({
      executive: o.exec,
      avgDiscount: Math.round(o.avgDiscount),
      bookingCount: o.count,
      multipleOfBaseline: Number((o.avgDiscount / overallAvg).toFixed(1)),
    })),
  };
}
