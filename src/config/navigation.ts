import {
  LayoutDashboard, Users, Building2, Grid3x3, FileSignature, Wallet, Handshake,
  Percent, FileText, ScrollText, KeyRound, UserRound, Sparkles, ShieldCheck, History,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Sales",
    items: [
      { label: "Leads", to: "/leads", icon: Users },
      { label: "Projects", to: "/projects", icon: Building2 },
      { label: "Inventory", to: "/inventory", icon: Grid3x3 },
      { label: "Bookings", to: "/bookings", icon: FileSignature },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payments", to: "/payments", icon: Wallet },
      { label: "Partners", to: "/partners", icon: Handshake },
      { label: "Commissions", to: "/commissions", icon: Percent },
    ],
  },
  {
    label: "Compliance & Delivery",
    items: [
      { label: "Documents", to: "/documents", icon: FileText },
      { label: "RERA", to: "/rera", icon: ScrollText },
      { label: "Possession", to: "/possession", icon: KeyRound },
      { label: "Customers", to: "/customer/dashboard", icon: UserRound },
    ],
  },
  {
    label: "Intelligence & Control",
    items: [
      { label: "AI Insights", to: "/ai-insights", icon: Sparkles },
      { label: "Approvals", to: "/approvals", icon: ShieldCheck },
      { label: "Audit Log", to: "/audit", icon: History },
    ],
  },
];
