import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import {
  KpiCard,
  Meter,
  PageHeader,
  SectionCard,
  StatusBadge,
  DataTable,
  Td,
  Th,
  EmptyState,
} from "@/components/common/primitives";
import { ProjectPricingPanel } from "@/components/ai/project-pricing-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  bookings,
  commissions,
  documents,
  partnerName,
  payments,
  possessionItems,
  projectById,
  reraItems,
  units,
} from "@/lib/mock/data";
import { inr, num, shortDate } from "@/lib/format";
import {
  ArrowLeft,
  Building2,
  IndianRupee,
  KeyRound,
  Layers,
  TrendingUp,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/projects/$projectId")({
  loader: ({ params }) => {
    const project = projectById(params.projectId);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.project.name} — Estatum ERP` : "Project — Estatum ERP";
    const description =
      "Project control room: inventory, sales, payments, channel partners, documents, RERA and possession.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: ProjectDetail,
  errorComponent: () => (
    <AppShell>
      <p className="text-sm text-danger">Unable to load this project.</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="text-sm text-muted-foreground">Project not found.</p>
    </AppShell>
  ),
});

const TABS = [
  "Overview",
  "Inventory",
  "Sales",
  "Payments",
  "Channel Partners",
  "Documents",
  "RERA",
  "Possession",
  "Analytics",
];

function ProjectDetail() {
  const { project } = Route.useLoaderData();
  const projectUnits = units.filter((u) => u.projectId === project.id);
  const projectBookings = bookings.filter((b) => b.projectId === project.id);
  const projectPayments = payments.filter((p) => p.projectId === project.id);
  const projectDocs = documents.filter((d) => d.projectId === project.id);
  const projectRera = reraItems.filter((r) => r.projectId === project.id);
  const projectPossession = possessionItems.filter((p) => p.projectId === project.id);
  const projectCommissions = commissions.filter((c) =>
    projectBookings.some((b) => b.id === c.bookingId),
  );

  return (
    <AppShell>
      <div className="space-y-5">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to projects
        </Link>

        <PageHeader
          title={project.name}
          subtitle={`${project.locality}, ${project.city} · RERA ${project.rera}`}
          actions={<StatusBadge status={project.status} tone="blue" />}
        />

        <Tabs defaultValue="Overview">
          <TabsList className="flex h-auto w-full flex-wrap justify-start">
            {TABS.map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="Overview" className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Revenue booked"
                value={inr(project.revenue)}
                change={9.4}
                icon={IndianRupee}
                accent
              />
              <KpiCard label="Units sold" value={num(project.sold)} change={6.1} icon={Building2} />
              <KpiCard
                label="Available"
                value={num(project.available)}
                change={-3.2}
                icon={Layers}
              />
              <KpiCard
                label="Sales velocity"
                value={`${project.velocity} / mo`}
                change={4.8}
                icon={TrendingUp}
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <SectionCard title="Collection progress" className="lg:col-span-2">
                <div className="flex items-baseline justify-between">
                  <span className="num text-2xl font-semibold">{project.collectionPct}%</span>
                  <span className="text-xs text-muted-foreground">of demanded value collected</span>
                </div>
                <div className="mt-2">
                  <Meter value={project.collectionPct} />
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="num text-2xl font-semibold">{project.construction}%</span>
                  <span className="text-xs text-muted-foreground">
                    construction complete · possession {shortDate(project.possession)}
                  </span>
                </div>
                <div className="mt-2">
                  <Meter value={project.construction} tone="teal" />
                </div>
              </SectionCard>
              <ProjectPricingPanel project={project} />
            </div>
          </TabsContent>

          <TabsContent value="Inventory" className="mt-4">
            <SectionCard
              title="Unit inventory"
              description={`${projectUnits.length} units`}
              action={
                <Button asChild size="sm" variant="outline">
                  <Link to="/inventory">Open inventory grid</Link>
                </Button>
              }
            >
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-10">
                {projectUnits.slice(0, 60).map((u) => (
                  <div key={u.id} className="rounded-md border border-border p-1.5 text-center">
                    <p className="text-[11px] font-semibold">{u.code}</p>
                    <p className="num text-[10px] text-muted-foreground">{inr(u.price)}</p>
                    <p className="mt-1 truncate text-[9px] font-semibold tracking-wide uppercase text-muted-foreground">
                      {u.status}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="Sales" className="mt-4">
            <DataTable
              head={
                <>
                  <Th>Booking</Th>
                  <Th>Customer</Th>
                  <Th>Unit</Th>
                  <Th>Amount</Th>
                  <Th>Executive</Th>
                  <Th>Status</Th>
                </>
              }
            >
              {projectBookings.slice(0, 20).map((b) => (
                <tr key={b.id} className="hover:bg-muted/50">
                  <Td className="font-medium">{b.id}</Td>
                  <Td>{b.customer}</Td>
                  <Td>{units.find((u) => u.id === b.unitId)?.code}</Td>
                  <Td className="num">{inr(b.amount)}</Td>
                  <Td className="text-muted-foreground">{b.executive}</Td>
                  <Td>
                    <StatusBadge status={b.status} />
                  </Td>
                </tr>
              ))}
            </DataTable>
          </TabsContent>

          <TabsContent value="Payments" className="mt-4">
            <DataTable
              head={
                <>
                  <Th>Customer</Th>
                  <Th>Milestone</Th>
                  <Th>Due</Th>
                  <Th>Paid</Th>
                  <Th>Outstanding</Th>
                  <Th>Status</Th>
                </>
              }
            >
              {projectPayments.slice(0, 20).map((p) => (
                <tr key={p.id} className="hover:bg-muted/50">
                  <Td>{p.customer}</Td>
                  <Td className="text-muted-foreground">{p.milestone}</Td>
                  <Td className="num">{inr(p.due)}</Td>
                  <Td className="num">{inr(p.paid)}</Td>
                  <Td className="num">{inr(p.due - p.paid)}</Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                </tr>
              ))}
            </DataTable>
          </TabsContent>

          <TabsContent value="Channel Partners" className="mt-4">
            <DataTable
              head={
                <>
                  <Th>Partner</Th>
                  <Th>Booking</Th>
                  <Th>Unit</Th>
                  <Th>Rate</Th>
                  <Th>Commission</Th>
                  <Th>Status</Th>
                </>
              }
            >
              {projectCommissions.slice(0, 20).map((c) => (
                <tr key={c.id} className="hover:bg-muted/50">
                  <Td className="font-medium">{partnerName(c.partnerId)}</Td>
                  <Td>{c.bookingId}</Td>
                  <Td>{c.unitCode}</Td>
                  <Td className="num">{c.ratePct}%</Td>
                  <Td className="num">{inr(c.amount)}</Td>
                  <Td>
                    <StatusBadge status={c.status} />
                  </Td>
                </tr>
              ))}
            </DataTable>
          </TabsContent>

          <TabsContent value="Documents" className="mt-4">
            {projectDocs.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents uploaded"
                description="Customer KYC and agreements for this project will appear here once uploaded."
              />
            ) : (
              <DataTable
                head={
                  <>
                    <Th>Type</Th>
                    <Th>Customer</Th>
                    <Th>Uploaded</Th>
                    <Th>AI confidence</Th>
                    <Th>Status</Th>
                  </>
                }
              >
                {projectDocs.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/50">
                    <Td className="font-medium">{d.type}</Td>
                    <Td>{d.customer}</Td>
                    <Td className="text-muted-foreground">{shortDate(d.uploaded)}</Td>
                    <Td className="num">{d.confidence}%</Td>
                    <Td>
                      <StatusBadge status={d.verification} />
                    </Td>
                  </tr>
                ))}
              </DataTable>
            )}
          </TabsContent>

          <TabsContent value="RERA" className="mt-4">
            <DataTable
              head={
                <>
                  <Th>Task</Th>
                  <Th>Authority</Th>
                  <Th>Due</Th>
                  <Th>Severity</Th>
                  <Th>Penalty exposure</Th>
                  <Th>Status</Th>
                </>
              }
            >
              {projectRera.map((r) => (
                <tr key={r.id} className="hover:bg-muted/50">
                  <Td className="font-medium">{r.task}</Td>
                  <Td className="text-muted-foreground">{r.authority}</Td>
                  <Td>{shortDate(r.due)}</Td>
                  <Td>
                    <StatusBadge status={r.severity} />
                  </Td>
                  <Td className="num">{inr(r.penalty)}</Td>
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                </tr>
              ))}
            </DataTable>
          </TabsContent>

          <TabsContent value="Possession" className="mt-4">
            {projectPossession.length === 0 ? (
              <EmptyState
                icon={KeyRound}
                title="No units in possession pipeline"
                description="Units enter this pipeline once construction crosses 90% and final payment is demanded."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projectPossession.map((p) => (
                  <div key={p.id} className="surface p-4">
                    <p className="text-sm font-semibold">{p.customer}</p>
                    <p className="text-xs text-muted-foreground">
                      Unit {p.unitCode} · {p.stage}
                    </p>
                    <div className="mt-3">
                      <Meter value={p.completion} tone="teal" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.completion}% complete · handover {shortDate(p.handoverDate)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="Analytics" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Avg realisation"
                value={`₹${num(project.ratePerSqft)}/sq.ft`}
                change={3.1}
              />
              <KpiCard label="Discount leakage" value="1.6%" change={-0.4} />
              <KpiCard label="Site visit → booking" value="19.4%" change={2.2} />
              <KpiCard
                label="Collection efficiency"
                value={`${project.collectionPct}%`}
                change={1.9}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
