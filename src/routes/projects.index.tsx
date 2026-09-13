import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  KpiCard,
  Meter,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/common/primitives";
import { projects, totals, type Project } from "@/lib/mock/data";
import { inr, num, shortDate } from "@/lib/format";
import { Building2, IndianRupee, Layers, TrendingUp } from "lucide-react";

/**
 * Leaflet touches window/document at module load, which breaks SSR — this
 * defers even importing the module until after mount, so it never runs
 * server-side (a static import + a mount-gate on the JSX isn't enough on
 * its own, since the module body still evaluates during SSR either way).
 */
function useProjectsMap() {
  const [Map, setMap] = useState<ComponentType<{ projects: Project[] }> | null>(null);
  useEffect(() => {
    let cancelled = false;
    import("@/components/projects/projects-map").then((m) => {
      if (!cancelled) setMap(() => m.ProjectsMap);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return Map;
}

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — Estatum ERP" },
      {
        name: "description",
        content:
          "Portfolio view of every project: RERA number, inventory split, revenue and construction progress.",
      },
      { property: "og:title", content: "Projects — Estatum ERP" },
      {
        property: "og:description",
        content:
          "Track inventory, revenue and construction progress across your project portfolio.",
      },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const ProjectsMap = useProjectsMap();

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          title="Projects"
          subtitle={`${projects.length} projects · ${num(totals.units)} units under management`}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Portfolio revenue"
            value={inr(totals.revenue)}
            change={11.8}
            icon={IndianRupee}
            accent
          />
          <KpiCard
            label="Units sold"
            value={num(projects.reduce((s, p) => s + p.sold, 0))}
            change={9.1}
            icon={Building2}
          />
          <KpiCard
            label="Available inventory"
            value={num(totals.available)}
            change={-4.1}
            icon={Layers}
          />
          <KpiCard label="Avg sales velocity" value="18 / mo" change={5.2} icon={TrendingUp} />
        </div>

        <SectionCard title="Project locations" description="Click a pin to open that project">
          {ProjectsMap ? (
            <ProjectsMap projects={projects} />
          ) : (
            <div className="h-[360px] animate-pulse rounded-lg border border-border bg-muted/30" />
          )}
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              to="/projects/$projectId"
              params={{ projectId: p.id }}
              className="surface flex flex-col p-4 transition-shadow hover:shadow-raised"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold">{p.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {p.locality}, {p.city}
                  </p>
                </div>
                <StatusBadge
                  status={p.status}
                  tone={
                    p.status === "Delivered"
                      ? "green"
                      : p.status === "Pre-launch"
                        ? "blue"
                        : "amber"
                  }
                />
              </div>

              <p className="mt-2 text-[11px] text-muted-foreground">RERA {p.rera}</p>

              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  ["Total", num(p.totalUnits)],
                  ["Avail", num(p.available)],
                  ["Booked", num(p.booked)],
                  ["Sold", num(p.sold)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-md border border-border bg-muted/40 py-1.5">
                    <p className="label-xs">{k}</p>
                    <p className="num text-sm font-semibold">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="label-xs">Revenue</span>
                <span className="num text-lg font-semibold">{inr(p.revenue)}</span>
              </div>
              <Meter value={(p.revenue / p.target) * 100} />
              <p className="mt-1 text-xs text-muted-foreground">
                {((p.revenue / p.target) * 100).toFixed(0)}% of {inr(p.target)} target
              </p>

              <div className="mt-3 border-t border-border pt-3">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Construction</span>
                  <span className="num font-semibold">{p.construction}%</span>
                </div>
                <div className="mt-1">
                  <Meter value={p.construction} tone="teal" />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Possession {shortDate(p.possession)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
