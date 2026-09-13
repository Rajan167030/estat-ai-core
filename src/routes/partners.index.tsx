import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  DataTable,
  EmptyState,
  KpiCard,
  PageHeader,
  SectionCard,
  StatusBadge,
  Td,
  Th,
} from "@/components/common/primitives";
import { Input } from "@/components/ui/input";
import { partners, totals } from "@/lib/mock/data";
import { inr, num, shortDate } from "@/lib/format";
import { Handshake, Trophy, IndianRupee, Percent } from "lucide-react";

export const Route = createFileRoute("/partners/")({
  head: () => ({
    meta: [
      { title: "Channel Partners — Estatum ERP" },
      {
        name: "description",
        content:
          "Channel partner network: leads, site visits, bookings, revenue contribution, commissions and conversion leaderboard.",
      },
      { property: "og:title", content: "Channel Partners — Estatum ERP" },
      {
        property: "og:description",
        content: "Partner performance, KYC status and commission standing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const [q, setQ] = useState("");
  const rows = useMemo(
    () =>
      partners.filter((p) =>
        `${p.firm} ${p.contact} ${p.city}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );
  const leaderboard = [...partners].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const revenue = partners.reduce((s, p) => s + p.revenue, 0);
  const pending = partners.reduce((s, p) => s + (p.commissionEarned - p.commissionPaid), 0);

  return (
    <AppShell>
      <PageHeader
        title="Channel partners"
        subtitle={`${num(totals.partners)} active partners across the network`}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active partners" value={num(totals.partners)} icon={Handshake} accent />
        <KpiCard label="Partner-sourced revenue" value={inr(revenue)} icon={IndianRupee} />
        <KpiCard
          label="Commission pending"
          value={inr(pending)}
          hint="awaiting approval or payout"
          icon={Percent}
        />
        <KpiCard
          label="KYC pending"
          value={String(partners.filter((p) => p.kyc === "Pending").length)}
          icon={Trophy}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Leaderboard" description="Top partners by revenue contribution">
          <ol className="space-y-3">
            {leaderboard.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="num flex size-6 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/partners/$partnerId"
                    params={{ partnerId: p.id }}
                    className="block truncate text-sm font-medium hover:text-primary"
                  >
                    {p.firm}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {p.bookings} bookings · {p.city}
                  </p>
                </div>
                <span className="num text-sm font-semibold">{inr(p.revenue)}</span>
              </li>
            ))}
          </ol>
        </SectionCard>

        <div className="lg:col-span-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search firm, contact or city"
            className="h-9 w-full sm:w-72"
          />
          <div className="mt-3">
            {rows.length === 0 ? (
              <EmptyState
                icon={Handshake}
                title="No partners found"
                description="Try a different firm name, contact person or city."
              />
            ) : (
              <DataTable
                head={
                  <>
                    <Th>Firm</Th>
                    <Th>Tier</Th>
                    <Th>KYC</Th>
                    <Th className="text-right">Leads</Th>
                    <Th className="text-right">Bookings</Th>
                    <Th className="text-right">Revenue</Th>
                    <Th className="text-right">Conversion</Th>
                    <Th>Since</Th>
                  </>
                }
              >
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/50">
                    <Td>
                      <Link
                        to="/partners/$partnerId"
                        params={{ partnerId: p.id }}
                        className="font-medium text-primary"
                      >
                        {p.firm}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {p.contact} · {p.city}
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge status={p.tier} />
                    </Td>
                    <Td>
                      <StatusBadge status={p.kyc} />
                    </Td>
                    <Td className="num text-right">{p.leads}</Td>
                    <Td className="num text-right">{p.bookings}</Td>
                    <Td className="num text-right font-semibold">{inr(p.revenue)}</Td>
                    <Td className="num text-right">
                      {p.leads > 0 ? ((p.bookings / p.leads) * 100).toFixed(1) : "0.0"}%
                    </Td>
                    <Td className="text-muted-foreground">{shortDate(p.since)}</Td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
