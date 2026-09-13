import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  EmptyState,
  KpiCard,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/common/primitives";
import { ProjectPricingPanel } from "@/components/ai/project-pricing-panel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { projects, units, type Unit, type UnitStatus } from "@/lib/mock/data";
import { inr, inrFull, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Grid3x3, Layers, SearchX, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Estatum ERP" },
      {
        name: "description",
        content:
          "Visual unit inventory by tower and floor with live pricing, status and AI pricing recommendations.",
      },
      { property: "og:title", content: "Inventory — Estatum ERP" },
      {
        property: "og:description",
        content: "Tower-and-floor unit grid with live status, pricing and AI pricing intelligence.",
      },
    ],
  }),
  component: InventoryPage,
});

const STATUS_STYLE: Record<UnitStatus, string> = {
  Available: "border-success/30 bg-success-soft hover:border-success",
  Hold: "border-warning/30 bg-warning-soft hover:border-warning",
  Booked: "border-primary/30 bg-info-soft hover:border-primary",
  Sold: "border-border bg-slate-soft hover:border-muted-foreground",
  "Possession Ready": "border-teal/30 bg-teal-soft hover:border-teal",
};

const STATUSES: UnitStatus[] = ["Available", "Hold", "Booked", "Sold", "Possession Ready"];

function InventoryPage() {
  const [projectId, setProjectId] = useState(projects[0]!.id);
  const [tower, setTower] = useState("all");
  const [config, setConfig] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Unit | null>(null);

  const project = projects.find((p) => p.id === projectId)!;

  const filtered = useMemo(
    () =>
      units.filter(
        (u) =>
          u.projectId === projectId &&
          (tower === "all" || u.tower === tower) &&
          (config === "all" || u.config === config) &&
          (status === "all" || u.status === status),
      ),
    [projectId, tower, config, status],
  );

  const floors = useMemo(() => {
    const map = new Map<number, Unit[]>();
    filtered.forEach((u) => map.set(u.floor, [...(map.get(u.floor) ?? []), u]));
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  const configs = [...new Set(units.filter((u) => u.projectId === projectId).map((u) => u.config))];

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          title="Inventory"
          subtitle={`${project.name} · ${num(filtered.length)} units in view`}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Available"
            value={num(filtered.filter((u) => u.status === "Available").length)}
            icon={Layers}
            accent
          />
          <KpiCard
            label="On hold"
            value={num(filtered.filter((u) => u.status === "Hold").length)}
            icon={Grid3x3}
          />
          <KpiCard
            label="Booked + sold"
            value={num(filtered.filter((u) => u.status === "Booked" || u.status === "Sold").length)}
            icon={Grid3x3}
          />
          <KpiCard
            label="Avg rate"
            value={`₹${num(project.ratePerSqft)}/sq.ft`}
            change={3.1}
            icon={TrendingUp}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="surface flex flex-wrap items-center gap-2 p-3">
              <Select
                value={projectId}
                onValueChange={(v) => {
                  setProjectId(v);
                  setTower("all");
                }}
              >
                <SelectTrigger className="h-9 w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tower} onValueChange={setTower}>
                <SelectTrigger className="h-9 w-[130px]">
                  <SelectValue placeholder="Tower" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All towers</SelectItem>
                  {project.towers.map((t) => (
                    <SelectItem key={t} value={t}>
                      Tower {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={config} onValueChange={setConfig}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Config" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All configs</SelectItem>
                  {configs.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-[170px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {STATUSES.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                  >
                    <span className={cn("size-2.5 rounded-sm border", STATUS_STYLE[s])} />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {floors.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No units match these filters"
                description="Adjust the tower, configuration or status filter to see available inventory."
                action={
                  <Button
                    size="sm"
                    onClick={() => {
                      setTower("all");
                      setConfig("all");
                      setStatus("all");
                    }}
                  >
                    Reset filters
                  </Button>
                }
              />
            ) : (
              <SectionCard title="Unit grid" description="Click a unit to open full details">
                <div className="space-y-2">
                  {floors.map(([floor, floorUnits]) => (
                    <div key={floor} className="flex gap-3">
                      <div className="w-14 shrink-0 pt-3 text-right">
                        <p className="label-xs">Floor</p>
                        <p className="num text-sm font-semibold">{floor}</p>
                      </div>
                      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
                        {floorUnits.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => setSelected(u)}
                            className={cn(
                              "rounded-md border px-2 py-2 text-left transition-colors",
                              STATUS_STYLE[u.status],
                            )}
                          >
                            <p className="text-xs font-semibold">{u.code}</p>
                            <p className="num text-[11px] text-muted-foreground">{inr(u.price)}</p>
                            <p className="mt-0.5 truncate text-[9px] font-semibold tracking-wide uppercase">
                              {u.status}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          <ProjectPricingPanel project={project} subtitle={`Tower ${project.towers[0] ?? "A"}`} />
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  Unit {selected.code}
                  <StatusBadge status={selected.status} />
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {[
                    ["Project", project.name],
                    ["Tower", `Tower ${selected.tower}`],
                    ["Floor", String(selected.floor)],
                    ["Configuration", selected.config],
                    ["Carpet area", `${num(selected.carpet)} sq.ft`],
                    ["Saleable area", `${num(selected.saleable)} sq.ft`],
                    ["Facing", selected.facing],
                    ["Parking", "1 covered"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="label-xs">{k}</dt>
                      <dd className="mt-0.5 text-sm font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="rounded-lg border border-border">
                  <div className="border-b border-border px-3 py-2 text-xs font-semibold">
                    Price build-up
                  </div>
                  <dl className="divide-y divide-border text-sm">
                    {[
                      ["Base price", selected.basePrice],
                      ["Floor premium", selected.floorPremium],
                      ["Facing premium", selected.facingPremium],
                      ["Parking", selected.parking],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex justify-between px-3 py-2">
                        <dt className="text-muted-foreground">{k as string}</dt>
                        <dd className="num">{inrFull(v as number)}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between bg-muted/50 px-3 py-2 font-semibold">
                      <dt>Final price</dt>
                      <dd className="num">{inrFull(selected.price)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <p className="label-xs">Booking details</p>
                  {selected.status === "Available" || selected.status === "Hold" ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      No booking against this unit yet.
                    </p>
                  ) : (
                    <div className="mt-1 space-y-1 text-sm">
                      <p>
                        Customer: <b className="font-medium">Rahul Sharma</b>
                      </p>
                      <p>
                        Channel partner: <b className="font-medium">Rajan Properties</b>
                      </p>
                      <p>
                        Booking value: <b className="num font-medium">{inr(selected.price)}</b>
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border p-3">
                  <p className="label-xs">Price history</p>
                  <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                    <li>Jun 2026 · {inr(selected.price * 0.94)} → launch price</li>
                    <li>Jul 2026 · {inr(selected.price * 0.97)} → phase 2 revision</li>
                    <li>Sep 2026 · {inr(selected.price)} → current</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={() => toast.success(`Unit ${selected.code} put on hold for 48 hours.`)}
                  >
                    Hold unit
                  </Button>
                  <Button
                    className="flex-1"
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success("Booking form opened.")}
                  >
                    Create booking
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
