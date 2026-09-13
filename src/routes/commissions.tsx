import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  DataTable,
  EmptyState,
  KpiCard,
  PageHeader,
  StatusBadge,
  Td,
  Th,
} from "@/components/common/primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { commissions, partnerName } from "@/lib/mock/data";
import { inr, shortDate } from "@/lib/format";
import { Percent, ShieldCheck, Wallet, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/commissions")({
  head: () => ({
    meta: [
      { title: "Commissions — Estatum ERP" },
      {
        name: "description",
        content:
          "Channel partner commissions: raised, pending approval, payable, paid and disputed, with approver on every line.",
      },
      { property: "og:title", content: "Commissions — Estatum ERP" },
      {
        property: "og:description",
        content: "Commission ledger with approval trail for every payout.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommissionsPage,
});

const TABS = ["All", "Pending Approval", "Payable", "Paid", "Disputed"] as const;

function CommissionsPage() {
  const [tab, setTab] = useState<string>("All");
  const rows = commissions.filter((c) => (tab === "All" ? true : c.status === tab));
  const sum = (status: string) =>
    commissions.filter((c) => c.status === status).reduce((s, c) => s + c.amount, 0);

  return (
    <AppShell>
      <PageHeader
        title="Commissions"
        subtitle="Every payout carries an approver and an audit trail"
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total commission"
          value={inr(commissions.reduce((s, c) => s + c.amount, 0))}
          icon={Percent}
          accent
        />
        <KpiCard label="Pending approval" value={inr(sum("Pending Approval"))} icon={ShieldCheck} />
        <KpiCard label="Payable" value={inr(sum("Payable"))} icon={Wallet} />
        <KpiCard label="Paid" value={inr(sum("Paid"))} icon={Wallet} />
        <KpiCard label="Disputed" value={inr(sum("Disputed"))} icon={AlertTriangle} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {rows.length === 0 ? (
            <EmptyState
              icon={Percent}
              title="Nothing in this bucket"
              description="No commission lines currently carry this status."
            />
          ) : (
            <DataTable
              head={
                <>
                  <Th>Commission</Th>
                  <Th>Partner</Th>
                  <Th>Booking</Th>
                  <Th>Unit</Th>
                  <Th className="text-right">Rate</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Approver</Th>
                  <Th>Raised</Th>
                  <Th>Status</Th>
                </>
              }
            >
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-muted/50">
                  <Td className="num font-medium">{c.id}</Td>
                  <Td>
                    <Link
                      to="/partners/$partnerId"
                      params={{ partnerId: c.partnerId }}
                      className="font-medium text-primary"
                    >
                      {partnerName(c.partnerId)}
                    </Link>
                  </Td>
                  <Td>
                    <Link
                      to="/bookings/$bookingId"
                      params={{ bookingId: c.bookingId }}
                      className="text-primary"
                    >
                      #{c.bookingId}
                    </Link>
                  </Td>
                  <Td className="num">{c.unitCode}</Td>
                  <Td className="num text-right">{c.ratePct}%</Td>
                  <Td className="num text-right font-semibold">{inr(c.amount)}</Td>
                  <Td className="text-muted-foreground">{c.approver}</Td>
                  <Td className="text-muted-foreground">{shortDate(c.raised)}</Td>
                  <Td>
                    <StatusBadge status={c.status} />
                  </Td>
                </tr>
              ))}
            </DataTable>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
