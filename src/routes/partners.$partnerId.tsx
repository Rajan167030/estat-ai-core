import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import {
  DataTable,
  EmptyState,
  KpiCard,
  Meter,
  PageHeader,
  SectionCard,
  StatusBadge,
  Td,
  Th,
} from "@/components/common/primitives";
import { GovernanceNote } from "@/components/ai/ai-cards";
import { Button } from "@/components/ui/button";
import { bookings, commissions, leads, partnerById, projectName, unitById } from "@/lib/mock/data";
import { inr, shortDate } from "@/lib/format";
import { AlertTriangle, Handshake, IndianRupee, Percent, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/partners/$partnerId")({
  loader: ({ params }) => {
    const p = partnerById(params.partnerId);
    if (!p) throw notFound();
    return { partnerId: p.id };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Channel partner ${params.partnerId} — Estatum ERP` },
      {
        name: "description",
        content:
          "Partner profile: KYC, lead attribution history, site visits, bookings, revenue and commission standing.",
      },
      { property: "og:title", content: `Channel partner ${params.partnerId} — Estatum ERP` },
      {
        property: "og:description",
        content: "Partner KYC, attribution history and commission ledger.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PartnerDetail,
  notFoundComponent: () => (
    <AppShell>
      <EmptyState
        icon={Handshake}
        title="Partner not found"
        description="This channel partner is no longer part of the network."
        action={
          <Link to="/partners" className="text-sm font-semibold text-primary">
            Back to partners
          </Link>
        }
      />
    </AppShell>
  ),
});

function PartnerDetail() {
  const { partnerId } = Route.useLoaderData();
  const p = partnerById(partnerId)!;
  const partnerLeads = leads.filter((l) => l.partnerId === p.id).slice(0, 8);
  const partnerBookings = bookings.filter((b) => b.partnerId === p.id).slice(0, 8);
  const partnerCommissions = commissions.filter((c) => c.partnerId === p.id).slice(0, 8);
  const pending = p.commissionEarned - p.commissionPaid;
  const conversion = p.leads > 0 ? (p.bookings / p.leads) * 100 : 0;
  const duplicate = partnerLeads[0];

  return (
    <AppShell>
      <PageHeader
        title={p.firm}
        subtitle={`${p.contact} · ${p.city} · partner since ${shortDate(p.since)}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/partners">All partners</Link>
          </Button>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge status={p.tier} />
        <StatusBadge
          status={`KYC ${p.kyc}`}
          tone={p.kyc === "Verified" ? "green" : p.kyc === "Pending" ? "amber" : "red"}
        />
        <StatusBadge status={`Rating ${p.rating.toFixed(1)}`} tone="blue" />
        {p.disputes > 0 ? <StatusBadge status={`${p.disputes} disputes`} tone="red" /> : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Leads registered" value={String(p.leads)} icon={Users} accent />
        <KpiCard label="Site visits" value={String(p.visits)} />
        <KpiCard label="Bookings" value={String(p.bookings)} icon={Handshake} />
        <KpiCard label="Revenue" value={inr(p.revenue)} icon={IndianRupee} />
        <KpiCard label="Commission pending" value={inr(Math.max(0, pending))} icon={Percent} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Attribution flow"
          description="Register → Duplicate check → Attribution → Visit → Booking → Commission"
        >
          <ol className="space-y-2 text-sm">
            {[
              "Lead registered",
              "Duplicate check",
              "Attribution locked",
              "Site visit",
              "Booking",
              "Commission",
            ].map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span className="num flex size-6 items-center justify-center rounded-full border border-border text-xs">
                  {i + 1}
                </span>
                <span className="font-medium">{s}</span>
              </li>
            ))}
          </ol>
          {duplicate ? (
            <div className="mt-4 rounded-md border border-warning/25 bg-warning-soft p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                <AlertTriangle className="size-3.5" /> Potential duplicate lead
              </p>
              <p className="mt-1 text-sm">
                {duplicate.name} already exists as <b>{duplicate.id}</b>, attributed to {p.firm}.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/leads/$leadId" params={{ leadId: duplicate.id }}>
                    View existing lead
                  </Link>
                </Button>
                <Button
                  size="sm"
                  onClick={() => toast.success("Attribution review requested from Sales Head.")}
                >
                  Request attribution review
                </Button>
              </div>
            </div>
          ) : null}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Conversion</span>
              <span className="num font-semibold text-foreground">{conversion.toFixed(1)}%</span>
            </div>
            <Meter value={conversion * 5} tone="teal" />
          </div>
          <GovernanceNote requirement="Attribution changes need Sales Head approval" />
        </SectionCard>

        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            title="Lead history"
            description="Latest leads registered by this partner"
            bodyClassName="p-0"
          >
            {partnerLeads.length === 0 ? (
              <div className="p-4">
                <p className="text-sm text-muted-foreground">No leads registered yet.</p>
              </div>
            ) : (
              <DataTable
                head={
                  <>
                    <Th>Lead</Th>
                    <Th>Project</Th>
                    <Th className="text-right">Score</Th>
                    <Th>Status</Th>
                    <Th>Next follow-up</Th>
                  </>
                }
              >
                {partnerLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/50">
                    <Td>
                      <Link
                        to="/leads/$leadId"
                        params={{ leadId: l.id }}
                        className="font-medium text-primary"
                      >
                        {l.name}
                      </Link>
                    </Td>
                    <Td className="text-muted-foreground">{projectName(l.projectId)}</Td>
                    <Td className="num text-right">{l.score}</Td>
                    <Td>
                      <StatusBadge status={l.status} />
                    </Td>
                    <Td className="text-muted-foreground">{shortDate(l.nextFollowUp)}</Td>
                  </tr>
                ))}
              </DataTable>
            )}
          </SectionCard>

          <SectionCard
            title="Bookings & commission"
            description="Closed deals and payout standing"
            bodyClassName="p-0"
          >
            <DataTable
              head={
                <>
                  <Th>Booking</Th>
                  <Th>Unit</Th>
                  <Th className="text-right">Value</Th>
                  <Th className="text-right">Commission</Th>
                  <Th>Status</Th>
                </>
              }
            >
              {partnerBookings.map((b) => {
                const c = partnerCommissions.find((x) => x.bookingId === b.id);
                return (
                  <tr key={b.id} className="hover:bg-muted/50">
                    <Td>
                      <Link
                        to="/bookings/$bookingId"
                        params={{ bookingId: b.id }}
                        className="font-medium text-primary"
                      >
                        #{b.id}
                      </Link>
                    </Td>
                    <Td className="num">{unitById(b.unitId)?.code ?? "—"}</Td>
                    <Td className="num text-right">{inr(b.amount)}</Td>
                    <Td className="num text-right">{c ? inr(c.amount) : "—"}</Td>
                    <Td>
                      {c ? <StatusBadge status={c.status} /> : <StatusBadge status={b.status} />}
                    </Td>
                  </tr>
                );
              })}
            </DataTable>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
