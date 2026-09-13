import { createFileRoute } from "@tanstack/react-router";
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
  Meter,
} from "@/components/common/primitives";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  bookings,
  documents,
  payments,
  possessionItems,
  units,
  projects,
  projectName,
} from "@/lib/mock/data";
import { inr } from "@/lib/format";
import { UserRound, Wallet, FileCheck, KeyRound, SearchX } from "lucide-react";

export const Route = createFileRoute("/customer/dashboard")({
  head: () => ({
    meta: [
      { title: "Customer Dashboard — Estatum ERP" },
      {
        name: "description",
        content:
          "Every customer in one place: booking status, payment progress, document verification and possession stage.",
      },
      { property: "og:title", content: "Customer Dashboard — Estatum ERP" },
      {
        property: "og:description",
        content: "Post-booking customer view — payments, documents and possession, all in one row.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomerDashboardPage,
});

type PaymentStatus = "Paid" | "Partial" | "Overdue" | "No dues yet";

interface CustomerRow {
  bookingId: string;
  customer: string;
  projectId: string;
  unitCode: string;
  bookingStatus: (typeof bookings)[number]["status"];
  totalDue: number;
  totalPaid: number;
  paymentStatus: PaymentStatus;
  docsVerified: number;
  docsTotal: number;
  possessionStage?: (typeof possessionItems)[number]["stage"];
  possessionCompletion?: number;
}

function buildCustomerRows(): CustomerRow[] {
  return bookings.map((b) => {
    const unit = units.find((u) => u.id === b.unitId);
    const bookingPayments = payments.filter((p) => p.bookingId === b.id);
    const totalDue = bookingPayments.reduce((s, p) => s + p.due, 0);
    const totalPaid = bookingPayments.reduce((s, p) => s + p.paid, 0);
    const hasOverdue = bookingPayments.some((p) => p.status === "Overdue");
    const paymentStatus: PaymentStatus =
      bookingPayments.length === 0
        ? "No dues yet"
        : hasOverdue
          ? "Overdue"
          : totalPaid >= totalDue
            ? "Paid"
            : "Partial";
    const custDocs = documents.filter((d) => d.customer === b.customer);
    const possession = possessionItems.find((p) => p.customer === b.customer);

    return {
      bookingId: b.id,
      customer: b.customer,
      projectId: b.projectId,
      unitCode: unit?.code ?? "—",
      bookingStatus: b.status,
      totalDue,
      totalPaid,
      paymentStatus,
      docsVerified: custDocs.filter((d) => d.verification === "Verified").length,
      docsTotal: custDocs.length,
      ...(possession
        ? { possessionStage: possession.stage, possessionCompletion: possession.completion }
        : {}),
    };
  });
}

const PAYMENT_TONE: Record<PaymentStatus, "green" | "amber" | "red" | "neutral"> = {
  Paid: "green",
  Partial: "amber",
  Overdue: "red",
  "No dues yet": "neutral",
};

function CustomerDashboardPage() {
  const rows = useMemo(buildCustomerRows, []);
  const [q, setQ] = useState("");
  const [project, setProject] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = rows.filter((r) => {
    if (q && !`${r.customer} ${r.unitCode}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (project !== "all" && r.projectId !== project) return false;
    if (status !== "all" && r.paymentStatus !== status) return false;
    return true;
  });

  const fullyPaid = rows.filter((r) => r.paymentStatus === "Paid").length;
  const pendingDocs = rows.filter((r) => r.docsTotal > 0 && r.docsVerified < r.docsTotal).length;
  const inPossession = rows.filter(
    (r) => r.possessionStage === "Possession Ready" || r.possessionStage === "Handover",
  ).length;

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          title="Customer Dashboard"
          subtitle={`${rows.length} customers across ${projects.length} projects`}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total customers" value={String(rows.length)} icon={UserRound} accent />
          <KpiCard label="Fully paid" value={String(fullyPaid)} icon={Wallet} />
          <KpiCard label="Documents pending" value={String(pendingDocs)} icon={FileCheck} />
          <KpiCard label="In possession stage" value={String(inPossession)} icon={KeyRound} />
        </div>

        <SectionCard
          title="Customers"
          description="Booking, payment, documents and possession — one row per customer"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search customer or unit"
              className="h-9 w-full sm:w-64"
            />
            <Select value={project} onValueChange={setProject}>
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[170px]">
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payment statuses</SelectItem>
                {(["Paid", "Partial", "Overdue", "No dues yet"] as const).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4">
            {filtered.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No customers match these filters"
                description="Try another project, status or search term."
              />
            ) : (
              <DataTable
                head={
                  <>
                    <Th>Customer</Th>
                    <Th>Project · Unit</Th>
                    <Th>Booking</Th>
                    <Th>Payment</Th>
                    <Th>Documents</Th>
                    <Th>Possession</Th>
                  </>
                }
              >
                {filtered.slice(0, 100).map((r) => (
                  <tr key={r.bookingId} className="hover:bg-muted/50">
                    <Td className="font-medium">
                      {r.customer}
                      <span className="block text-xs text-muted-foreground">{r.bookingId}</span>
                    </Td>
                    <Td className="text-muted-foreground">
                      {projectName(r.projectId)} · {r.unitCode}
                    </Td>
                    <Td>
                      <StatusBadge
                        status={r.bookingStatus}
                        tone={
                          r.bookingStatus === "Confirmed"
                            ? "green"
                            : r.bookingStatus === "Pending"
                              ? "amber"
                              : "red"
                        }
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={r.paymentStatus}
                          tone={PAYMENT_TONE[r.paymentStatus]}
                        />
                        {r.totalDue > 0 && (
                          <span className="num text-xs text-muted-foreground">
                            {inr(r.totalPaid)} / {inr(r.totalDue)}
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td className="text-muted-foreground">
                      {r.docsTotal > 0
                        ? `${r.docsVerified} / ${r.docsTotal} verified`
                        : "No documents on file"}
                    </Td>
                    <Td>
                      {r.possessionStage ? (
                        <div className="min-w-[120px]">
                          <div className="flex items-center justify-between text-xs">
                            <span>{r.possessionStage}</span>
                            <span className="num text-muted-foreground">
                              {r.possessionCompletion}%
                            </span>
                          </div>
                          <div className="mt-1">
                            <Meter value={r.possessionCompletion ?? 0} tone="teal" />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not started</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
