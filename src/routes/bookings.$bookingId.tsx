import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import {
  DataTable, EmptyState, KpiCard, Meter, PageHeader, SectionCard, StatusBadge, Td, Th,
} from "@/components/common/primitives";
import { GovernanceNote } from "@/components/ai/ai-cards";
import { Button } from "@/components/ui/button";
import {
  bookingById, commissions, documents, partnerName, payments, projectName, unitById,
} from "@/lib/mock/data";
import { inr, inrFull, shortDate } from "@/lib/format";
import { FileSignature, IndianRupee, Percent, Wallet } from "lucide-react";

export const Route = createFileRoute("/bookings/$bookingId")({
  loader: ({ params }) => {
    const booking = bookingById(params.bookingId);
    if (!booking) throw notFound();
    return { bookingId: booking.id };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Booking #${params.bookingId} — Estatum ERP` },
      { name: "description", content: `Booking ${params.bookingId}: unit, value, payment schedule, documents, channel partner commission and approval history.` },
      { property: "og:title", content: `Booking #${params.bookingId} — Estatum ERP` },
      { property: "og:description", content: "Booking detail with payment schedule, documents and commission." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingDetail,
  notFoundComponent: () => (
    <AppShell>
      <EmptyState
        icon={FileSignature}
        title="Booking not found"
        description="This booking may have been cancelled or merged into another record."
        action={<Link to="/bookings" className="text-sm font-semibold text-primary">Back to bookings</Link>}
      />
    </AppShell>
  ),
});

function BookingDetail() {
  const { bookingId } = Route.useLoaderData();
  const b = bookingById(bookingId)!;
  const unit = unitById(b.unitId);
  const schedule = payments.filter((p) => p.bookingId === b.id);
  const paid = schedule.reduce((s, p) => s + p.paid, 0);
  const due = schedule.reduce((s, p) => s + p.due, 0);
  const commission = commissions.find((c) => c.bookingId === b.id);
  const docs = documents.filter((d) => d.customer === b.customer).slice(0, 5);
  const progress = due > 0 ? Math.round((paid / due) * 100) : 0;

  return (
    <AppShell>
      <PageHeader
        title={`Booking #${b.id}`}
        subtitle={`${b.customer} · ${projectName(b.projectId)} · ${unit?.code ?? "—"}`}
        actions={<Button variant="outline" size="sm" asChild><Link to="/bookings">All bookings</Link></Button>}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Booking value" value={inr(b.amount)} icon={IndianRupee} accent />
        <KpiCard label="Discount given" value={inr(b.discount)} icon={Percent} />
        <KpiCard label="Collected" value={inr(paid)} hint={`${progress}% of schedule`} icon={Wallet} />
        <KpiCard label="Outstanding" value={inr(Math.max(0, due - paid))} icon={Wallet} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Booking summary" description="Customer, unit and attribution" className="lg:col-span-2">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
            <Field label="Customer" value={b.customer} />
            <Field label="Lead" value={b.leadId} />
            <Field label="Project" value={projectName(b.projectId)} />
            <Field label="Unit" value={unit?.code ?? "—"} />
            <Field label="Configuration" value={unit?.config ?? "—"} />
            <Field label="Carpet area" value={unit ? `${unit.area} sq.ft` : "—"} />
            <Field label="Sales executive" value={b.executive} />
            <Field label="Channel partner" value={partnerName(b.partnerId)} />
            <Field label="Booking date" value={shortDate(b.date)} />
            <Field label="Agreement value" value={inrFull(b.amount)} />
            <Field label="Status" value={b.status} />
          </dl>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Collection progress</span><span className="num font-semibold text-foreground">{progress}%</span>
            </div>
            <Meter value={progress} tone={progress > 70 ? "green" : "blue"} />
          </div>
        </SectionCard>

        <SectionCard title="Channel partner commission" description="Payable after approval">
          {commission ? (
            <div className="space-y-3 text-sm">
              <Field label="Partner" value={partnerName(commission.partnerId)} />
              <Field label="Rate" value={`${commission.ratePct}%`} />
              <Field label="Amount" value={inrFull(commission.amount)} />
              <div className="flex items-center gap-2">
                <span className="label-xs">Status</span>
                <StatusBadge status={commission.status} />
              </div>
              <GovernanceNote requirement="Finance Head approval required before payout" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Direct booking — no channel partner commission applies.</p>
          )}
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Payment schedule" description="Milestone-linked demands" bodyClassName="p-0">
          <DataTable head={<><Th>Milestone</Th><Th className="text-right">Due</Th><Th className="text-right">Paid</Th><Th>Due date</Th><Th>Status</Th></>}>
            {schedule.map((p) => (
              <tr key={p.id} className="hover:bg-muted/50">
                <Td className="font-medium">{p.milestone}</Td>
                <Td className="num text-right">{inr(p.due)}</Td>
                <Td className="num text-right">{inr(p.paid)}</Td>
                <Td className="text-muted-foreground">{shortDate(p.dueDate)}</Td>
                <Td><StatusBadge status={p.status} /></Td>
              </tr>
            ))}
          </DataTable>
        </SectionCard>

        <SectionCard title="Documents" description="Verification status for this customer">
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet for this booking.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                  <span className="font-medium">{d.type}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {shortDate(d.uploaded)} <StatusBadge status={d.verification} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-xs">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}
