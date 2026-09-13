import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bookings, partnerName, projectName, projects, unitById } from "@/lib/mock/data";
import { inr, shortDate } from "@/lib/format";
import { FileSignature, IndianRupee, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/bookings/")({
  head: () => ({
    meta: [
      { title: "Bookings — Estatum ERP" },
      {
        name: "description",
        content:
          "Track every booking: customer, unit, value, sales executive, channel partner and approval status.",
      },
      { property: "og:title", content: "Bookings — Estatum ERP" },
      {
        property: "og:description",
        content: "Booking pipeline with values, executives, channel partners and status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookingsPage,
});

function BookingsPage() {
  const [q, setQ] = useState("");
  const [project, setProject] = useState("all");
  const [status, setStatus] = useState("all");

  const rows = useMemo(
    () =>
      bookings.filter((b) => {
        const hay = `${b.id} ${b.customer} ${b.executive}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        if (project !== "all" && b.projectId !== project) return false;
        if (status !== "all" && b.status !== status) return false;
        return true;
      }),
    [q, project, status],
  );

  const confirmed = bookings.filter((b) => b.status === "Confirmed");
  const value = confirmed.reduce((s, b) => s + b.amount, 0);

  return (
    <AppShell>
      <PageHeader title="Bookings" subtitle={`${bookings.length} bookings in the current cycle`} />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total bookings"
          value={String(bookings.length)}
          icon={FileSignature}
          accent
        />
        <KpiCard label="Confirmed value" value={inr(value)} icon={IndianRupee} />
        <KpiCard label="Confirmed" value={String(confirmed.length)} icon={CheckCircle2} />
        <KpiCard
          label="Pending"
          value={String(bookings.filter((b) => b.status === "Pending").length)}
          hint="awaiting approval"
          icon={Clock}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search booking ID, customer or executive"
          className="h-9 w-full sm:w-72"
        />
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger className="h-9 w-48">
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
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Confirmed">Confirmed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyState
            icon={FileSignature}
            title="No bookings match these filters"
            description="Try clearing the search or choosing a different project or status."
          />
        ) : (
          <DataTable
            head={
              <>
                <Th>Booking</Th>
                <Th>Customer</Th>
                <Th>Project</Th>
                <Th>Unit</Th>
                <Th className="text-right">Value</Th>
                <Th>Executive</Th>
                <Th>Channel partner</Th>
                <Th>Date</Th>
                <Th>Status</Th>
              </>
            }
          >
            {rows.map((b) => (
              <tr key={b.id} className="hover:bg-muted/50">
                <Td>
                  <Link
                    to="/bookings/$bookingId"
                    params={{ bookingId: b.id }}
                    className="font-semibold text-primary"
                  >
                    #{b.id}
                  </Link>
                </Td>
                <Td className="font-medium">{b.customer}</Td>
                <Td className="text-muted-foreground">{projectName(b.projectId)}</Td>
                <Td className="num">{unitById(b.unitId)?.code ?? "—"}</Td>
                <Td className="num text-right font-semibold">{inr(b.amount)}</Td>
                <Td className="text-muted-foreground">{b.executive}</Td>
                <Td className="text-muted-foreground">{partnerName(b.partnerId)}</Td>
                <Td className="text-muted-foreground">{shortDate(b.date)}</Td>
                <Td>
                  <StatusBadge status={b.status} />
                </Td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </AppShell>
  );
}
