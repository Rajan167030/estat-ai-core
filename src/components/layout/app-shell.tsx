import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/config/navigation";
import { SearchCommand } from "@/components/layout/search-command";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell, Menu, Search, ShieldCheck, LogOut, Settings, Building, ChevronDown, AlertTriangle,
  CalendarClock, Wallet, Sparkles, ScrollText,
} from "lucide-react";
import { approvals } from "@/lib/mock/data";
import { toast } from "sonner";

const NOTIFICATIONS = [
  { icon: Wallet, title: "₹15L payment overdue", meta: "Rahul Sharma · Unit A-1204", tone: "text-danger" },
  { icon: CalendarClock, title: "9 follow-ups due today", meta: "Assigned across 4 executives", tone: "text-warning" },
  { icon: ShieldCheck, title: "Commission approval pending", meta: "Rajan Properties · ₹1.6L", tone: "text-primary" },
  { icon: ScrollText, title: "RERA filing in 8 days", meta: "Sereno Greens · penalty ₹5L", tone: "text-warning" },
  { icon: Sparkles, title: "Pricing engine flagged Tower B", meta: "Demand up 23% · approval required", tone: "text-ai" },
];

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-4">
      <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <Building className="size-4" />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold text-sidebar-foreground">Estatum</span>
        <span className="block text-[11px] text-navy-muted">ERP · Real Estate OS</span>
      </span>
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-[0.1em] text-navy-muted uppercase">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-sidebar-primary/18 text-sidebar-foreground"
                        : "text-navy-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                  >
                    <item.icon className={cn("size-4", active && "text-primary")} />
                    {item.label}
                    {active ? <span className="ml-auto h-4 w-0.5 rounded-full bg-primary" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <Brand />
      <SidebarNav onNavigate={onNavigate} />
      <div className="border-t border-sidebar-border px-4 py-3 text-[11px] text-navy-muted">
        <p className="font-semibold text-sidebar-foreground">Estatum Developers Pvt Ltd</p>
        <p>12 projects · 5,120 units</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pendingApprovals = approvals.length;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-sidebar-border lg:block">
        <SidebarBody />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur sm:px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-md border border-border bg-muted/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            <Search className="size-4" />
            <span className="truncate">Search leads, customers, units, projects...</span>
            <kbd className="ml-auto hidden rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium sm:block">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/approvals">
                <ShieldCheck className="size-4 text-primary" />
                <span className="num">{pendingApprovals}</span> Pending approvals
              </Link>
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="size-4.5" />
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b border-border px-3 py-2 text-sm font-semibold">Notifications</div>
                <ul className="divide-y divide-border">
                  {NOTIFICATIONS.map((n) => (
                    <li key={n.title} className="flex gap-2.5 px-3 py-2.5">
                      <n.icon className={cn("mt-0.5 size-4 shrink-0", n.tone)} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{n.meta}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted">
                  <span className="grid size-7 place-items-center rounded-full bg-navy text-[11px] font-semibold text-navy-foreground">
                    RK
                  </span>
                  <span className="hidden text-left leading-tight md:block">
                    <span className="block text-[13px] font-medium">Rajan Kulkarni</span>
                    <span className="block text-[11px] text-muted-foreground">Director</span>
                  </span>
                  <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">Rajan Kulkarni</p>
                  <p className="text-xs font-normal text-muted-foreground">Director · Estatum Developers</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => toast("Settings coming soon.")}>
                  <Settings className="size-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => toast("Signed out.")}>
                  <LogOut className="size-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 lg:px-6">{children}</main>
      </div>

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

export function RiskPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
      <AlertTriangle className="size-3.5" /> {label}
    </span>
  );
}
