/**
 * Estatum ERP — deterministic mock data layer.
 * Relational demo dataset: projects -> towers -> units -> leads -> bookings ->
 * payments -> partners -> commissions -> documents -> approvals -> audit.
 * Replace this module with real API calls; UI consumes it through services.ts.
 */

export const TODAY = new Date("2026-09-02T09:00:00Z");

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry(20260902);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)] as T;
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const chance = (p: number) => rnd() < p;
const iso = (dayOffset: number) =>
  new Date(TODAY.getTime() + dayOffset * 86_400_000).toISOString();

const FIRST = [
  "Rahul", "Priya", "Amit", "Sneha", "Vikram", "Ananya", "Rajan", "Meera", "Karthik", "Divya",
  "Suresh", "Neha", "Arjun", "Pooja", "Nikhil", "Kavya", "Rohan", "Ishita", "Manish", "Shreya",
  "Aditya", "Ritu", "Sanjay", "Farhan", "Tanvi", "Harsh", "Deepa", "Varun", "Aisha", "Gaurav",
];
const LAST = [
  "Sharma", "Patel", "Reddy", "Iyer", "Mehta", "Singh", "Nair", "Gupta", "Joshi", "Kulkarni",
  "Desai", "Rao", "Bansal", "Chopra", "Verma", "Shetty", "Kapoor", "Malhotra", "Pillai", "Ghosh",
];
const name = () => `${pick(FIRST)} ${pick(LAST)}`;

export const CITIES = [
  "Bengaluru", "Pune", "Hyderabad", "Mumbai", "Chennai", "Ahmedabad", "Noida", "Kochi",
];

export const SOURCES = [
  "Channel Partner", "Website", "Meta Ads", "Google Ads", "Walk-in", "Referral", "99acres",
] as const;
export type LeadSource = (typeof SOURCES)[number];

export type LeadStatus = "Hot" | "Warm" | "Cold" | "Converted" | "Lost";
export type UnitStatus = "Available" | "Hold" | "Booked" | "Sold" | "Possession Ready";
export type BookingStatus = "Confirmed" | "Pending" | "Cancelled";
export type Risk = "Low" | "Medium" | "High";

export interface Project {
  id: string;
  name: string;
  city: string;
  locality: string;
  rera: string;
  towers: string[];
  totalUnits: number;
  available: number;
  booked: number;
  sold: number;
  revenue: number;
  target: number;
  construction: number;
  status: "Pre-launch" | "Under Construction" | "Nearing Possession" | "Delivered";
  velocity: number;
  collectionPct: number;
  possession: string;
  ratePerSqft: number;
}

export interface Unit {
  id: string;
  code: string;
  projectId: string;
  tower: string;
  floor: number;
  config: string;
  carpet: number;
  saleable: number;
  facing: "East" | "West" | "North" | "South";
  basePrice: number;
  floorPremium: number;
  facingPremium: number;
  parking: number;
  price: number;
  status: UnitStatus;
  bookingId?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  projectId: string;
  source: LeadSource;
  partnerId?: string;
  score: number;
  status: LeadStatus;
  owner: string;
  budget: number;
  config: string;
  createdAt: string;
  lastActivity: string;
  nextFollowUp: string;
  siteVisits: number;
  calls: number;
}

export interface Partner {
  id: string;
  firm: string;
  contact: string;
  city: string;
  kyc: "Verified" | "Pending" | "Rejected";
  tier: "Platinum" | "Gold" | "Silver";
  leads: number;
  visits: number;
  bookings: number;
  revenue: number;
  commissionEarned: number;
  commissionPaid: number;
  rating: number;
  since: string;
  disputes: number;
}

export interface Booking {
  id: string;
  customer: string;
  leadId: string;
  projectId: string;
  unitId: string;
  amount: number;
  discount: number;
  executive: string;
  partnerId?: string;
  date: string;
  status: BookingStatus;
}

export interface Payment {
  id: string;
  bookingId: string;
  customer: string;
  unitCode: string;
  projectId: string;
  milestone: string;
  due: number;
  dueDate: string;
  paid: number;
  risk: Risk;
  delayProbability: number;
  status: "Paid" | "Partial" | "Due" | "Overdue";
}

export interface Commission {
  id: string;
  partnerId: string;
  bookingId: string;
  unitCode: string;
  ratePct: number;
  amount: number;
  status: "Pending Approval" | "Payable" | "Paid" | "Disputed";
  approver: string;
  raised: string;
}

export interface DocumentRecord {
  id: string;
  type: string;
  customer: string;
  projectId: string;
  uploaded: string;
  verification: "Verified" | "Needs Review" | "Rejected";
  confidence: number;
  fields: { label: string; value: string; confidence: number }[];
}

export interface Approval {
  id: string;
  kind: "Pricing" | "Discount" | "Commission" | "RERA" | "Other";
  title: string;
  entity: string;
  current: string;
  proposed: string;
  reason: string;
  requestedBy: string;
  requires: string;
  raised: string;
  impact: number;
}

export interface AuditEntry {
  id: string;
  time: string;
  user: string;
  action: string;
  entity: string;
  oldValue: string;
  newValue: string;
  approval: string;
}

export interface ReraItem {
  id: string;
  projectId: string;
  task: string;
  authority: string;
  due: string;
  severity: Risk;
  penalty: number;
  status: "Upcoming" | "Overdue" | "Completed";
}

export interface PossessionItem {
  id: string;
  customer: string;
  unitCode: string;
  projectId: string;
  stage: "Construction" | "Snagging" | "Final Payment" | "Possession Ready" | "Handover" | "RWA";
  completion: number;
  snags: number;
  handoverDate: string;
}

const PROJECT_NAMES = [
  "Estatum Heights", "Estatum Meridian", "Aurum Skyline", "Prestige Vantage", "Sereno Greens",
  "Lakeview Residences", "Mahalaxmi Icon", "Silverleaf Enclave", "Northgate Towers",
  "Emerald Bay", "Vertex One", "Harbour Crest",
];
const CONFIGS = ["1 BHK", "2 BHK", "2.5 BHK", "3 BHK", "4 BHK"];
const EXECS = ["Amit Sharma", "Neha Verma", "Rohan Pillai", "Kavya Nair", "Manish Bansal", "Divya Rao"];

export const projects: Project[] = PROJECT_NAMES.map((pname, i) => {
  const totalUnits = int(180, 620);
  const sold = Math.floor(totalUnits * (0.18 + rnd() * 0.35));
  const booked = Math.floor(totalUnits * (0.08 + rnd() * 0.14));
  const available = totalUnits - sold - booked;
  const ratePerSqft = int(5600, 11800);
  const revenue = sold * ratePerSqft * int(880, 1650);
  return {
    id: `PRJ-${100 + i}`,
    name: pname,
    city: CITIES[i % CITIES.length]!,
    locality: pick(["Whitefield", "Hinjewadi", "Gachibowli", "Andheri East", "OMR", "Bopal", "Sector 150", "Kakkanad"]),
    rera: `RERA/${CITIES[i % CITIES.length]!.slice(0, 3).toUpperCase()}/2024/${4000 + i * 7}`,
    towers: ["A", "B", "C", "D"].slice(0, int(2, 4)),
    totalUnits,
    available,
    booked,
    sold,
    revenue,
    target: Math.round(revenue * (1.15 + rnd() * 0.4)),
    construction: int(22, 98),
    status: pick(["Pre-launch", "Under Construction", "Nearing Possession", "Delivered"] as const),
    velocity: int(6, 34),
    collectionPct: int(58, 94),
    possession: iso(int(60, 900)),
    ratePerSqft,
  };
});

export const units: Unit[] = [];
projects.forEach((p) => {
  p.towers.forEach((tower) => {
    for (let floor = 1; floor <= 14; floor++) {
      for (let n = 1; n <= 4; n++) {
        const config = CONFIGS[(floor + n) % CONFIGS.length]!;
        const saleable = 620 + CONFIGS.indexOf(config) * 340 + int(0, 90);
        const basePrice = saleable * p.ratePerSqft;
        const floorPremium = Math.round(basePrice * floor * 0.0035);
        const facing = pick(["East", "West", "North", "South"] as const);
        const facingPremium = facing === "East" || facing === "North" ? Math.round(basePrice * 0.02) : 0;
        const parking = 350000;
        const roll = rnd();
        const status: UnitStatus =
          roll < 0.42 ? "Available" : roll < 0.5 ? "Hold" : roll < 0.67 ? "Booked" : roll < 0.9 ? "Sold" : "Possession Ready";
        units.push({
          id: `${p.id}-${tower}${floor * 100 + n}`,
          code: `${tower}-${floor * 100 + n}`,
          projectId: p.id,
          tower,
          floor,
          config,
          carpet: Math.round(saleable * 0.68),
          saleable,
          facing,
          basePrice,
          floorPremium,
          facingPremium,
          parking,
          price: basePrice + floorPremium + facingPremium + parking,
          status,
        });
      }
    }
  });
});

export const partners: Partner[] = Array.from({ length: 48 }, (_, i) => {
  const leads = int(30, 480);
  const visits = Math.floor(leads * (0.25 + rnd() * 0.3));
  const bookings = Math.floor(visits * (0.12 + rnd() * 0.25));
  const revenue = bookings * int(6200000, 12500000);
  const earned = Math.round(revenue * 0.02);
  return {
    id: `CP-${200 + i}`,
    firm: `${pick(["Rajan", "ABC", "Skyline", "Prime", "Urban", "Nexa", "Landmark", "Vista", "Metro", "Anand"])} ${pick(["Properties", "Realty", "Estates", "Homes", "Consultants"])}`,
    contact: name(),
    city: pick(CITIES),
    kyc: (chance(0.82) ? "Verified" : chance(0.6) ? "Pending" : "Rejected") as Partner["kyc"],
    tier: (bookings > 22 ? "Platinum" : bookings > 10 ? "Gold" : "Silver") as Partner["tier"],
    leads,
    visits,
    bookings,
    revenue,
    commissionEarned: earned,
    commissionPaid: Math.round(earned * (0.35 + rnd() * 0.55)),
    rating: Number((3.2 + rnd() * 1.8).toFixed(1)),
    since: iso(-int(200, 1400)),
    disputes: chance(0.2) ? int(1, 3) : 0,
  };
}).sort((a, b) => b.revenue - a.revenue);

export const leads: Lead[] = Array.from({ length: 260 }, (_, i) => {
  const project = pick(projects);
  const source = pick(SOURCES);
  const score = int(22, 98);
  const status: LeadStatus =
    score > 78 ? "Hot" : score > 55 ? "Warm" : chance(0.12) ? "Converted" : chance(0.1) ? "Lost" : "Cold";
  return {
    id: `LEAD-${10400 + i}`,
    name: name(),
    phone: `+91 9${int(100000000, 899999999)}`,
    email: `contact${i}@mail.com`,
    projectId: project.id,
    source,
    ...(source === "Channel Partner" ? { partnerId: pick(partners).id } : {}),
    score,
    status,
    owner: pick(EXECS),
    budget: int(45, 220) * 100000,
    config: pick(CONFIGS),
    createdAt: iso(-int(1, 160)),
    lastActivity: iso(-int(0, 20)),
    nextFollowUp: iso(int(-6, 12)),
    siteVisits: int(0, 3),
    calls: int(1, 14),
  };
});

export const bookings: Booking[] = Array.from({ length: 96 }, (_, i) => {
  const lead = leads[(i * 3) % leads.length]!;
  const project = projects.find((p) => p.id === lead.projectId)!;
  const unit = units.find((u) => u.projectId === project.id && u.status !== "Available") ?? units[i]!;
  const amount = unit.price;
  return {
    id: `BK-${1000 + i}`,
    customer: lead.name,
    leadId: lead.id,
    projectId: project.id,
    unitId: unit.id,
    amount,
    discount: chance(0.5) ? int(50000, 380000) : 0,
    executive: pick(EXECS),
    ...(lead.partnerId ? { partnerId: lead.partnerId } : chance(0.4) ? { partnerId: pick(partners).id } : {}),
    date: iso(-int(1, 210)),
    status: (chance(0.78) ? "Confirmed" : chance(0.7) ? "Pending" : "Cancelled") as Booking["status"],
  };
}).sort((a, b) => (a.date < b.date ? 1 : -1));

const MILESTONES = ["Booking Amount", "Agreement (20%)", "Plinth (15%)", "Slab 5 (10%)", "Slab 12 (10%)", "Possession (15%)"];

export const payments: Payment[] = bookings.flatMap((b, bi) => {
  const unit = units.find((u) => u.id === b.unitId)!;
  return MILESTONES.slice(0, int(3, 6)).map((milestone, mi) => {
    const due = Math.round(b.amount * (mi === 0 ? 0.1 : 0.15));
    const paidRatio = chance(0.55) ? 1 : chance(0.5) ? rnd() * 0.8 : 0;
    const dueDate = iso(-90 + mi * 45 + int(-8, 40));
    const overdue = new Date(dueDate) < TODAY && paidRatio < 1;
    const delayProbability = overdue ? int(52, 92) : int(6, 48);
    return {
      id: `PAY-${bi}-${mi}`,
      bookingId: b.id,
      customer: b.customer,
      unitCode: unit.code,
      projectId: b.projectId,
      milestone,
      due,
      dueDate,
      paid: Math.round(due * paidRatio),
      risk: delayProbability > 65 ? "High" : delayProbability > 35 ? "Medium" : "Low",
      delayProbability,
      status: paidRatio >= 1 ? "Paid" : overdue ? "Overdue" : paidRatio > 0 ? "Partial" : "Due",
    } satisfies Payment;
  });
});

export const commissions: Commission[] = bookings
  .filter((b) => b.partnerId)
  .map((b, i) => {
    const unit = units.find((u) => u.id === b.unitId)!;
    const ratePct = Number((1.5 + rnd() * 1.5).toFixed(2));
    return {
      id: `COM-${500 + i}`,
      partnerId: b.partnerId!,
      bookingId: b.id,
      unitCode: unit.code,
      ratePct,
      amount: Math.round((b.amount * ratePct) / 100),
      status: pick(["Pending Approval", "Payable", "Paid", "Paid", "Disputed"] as const),
      approver: pick(["Rohan Pillai", "Sales Head", "Finance Controller"]),
      raised: iso(-int(2, 120)),
    };
  });

export const documents: DocumentRecord[] = Array.from({ length: 54 }, (_, i) => {
  const b = bookings[i % bookings.length]!;
  const unit = units.find((u) => u.id === b.unitId)!;
  const low = chance(0.35);
  return {
    id: `DOC-${3000 + i}`,
    type: pick(["PAN Card", "Aadhaar", "Sale Agreement", "Allotment Letter", "Loan Sanction", "KYC Form", "NOC"]),
    customer: b.customer,
    projectId: b.projectId,
    uploaded: iso(-int(1, 90)),
    verification: low ? "Needs Review" : chance(0.92) ? "Verified" : "Rejected",
    confidence: low ? int(62, 79) : int(90, 99),
    fields: [
      { label: "Customer Name", value: b.customer, confidence: int(93, 99) },
      { label: "PAN", value: `ABCDE${int(1000, 9999)}F`, confidence: int(88, 99) },
      { label: "Unit", value: unit.code, confidence: low ? int(63, 78) : int(91, 99) },
      { label: "Agreement Value", value: `₹${(b.amount / 100000).toFixed(1)}L`, confidence: int(80, 98) },
    ],
  };
});

export const approvals: Approval[] = [
  {
    id: "APR-9001", kind: "Pricing", title: "Price change request", entity: "Estatum Heights · A-1204",
    current: "₹78L", proposed: "₹82L", reason: "Tower A demand up 18% with inventory down 12% over 30 days.",
    requestedBy: "AI Pricing Engine", requires: "Sales Manager approval", raised: iso(-1), impact: 400000,
  },
  {
    id: "APR-9002", kind: "Discount", title: "Discount above policy", entity: "Aurum Skyline · C-806",
    current: "₹1.2L standard", proposed: "₹3.8L", reason: "Customer comparing with competing project; executive requests exception.",
    requestedBy: "Amit Sharma", requires: "Sales Head approval", raised: iso(-2), impact: -260000,
  },
  {
    id: "APR-9003", kind: "Commission", title: "Commission payout release", entity: "Rajan Properties · BK-1028",
    current: "₹0 paid", proposed: "₹1.6L", reason: "Booking confirmed, agreement registered, 20% collection milestone reached.",
    requestedBy: "Finance Ops", requires: "Finance Controller approval", raised: iso(-3), impact: -160000,
  },
  {
    id: "APR-9004", kind: "RERA", title: "Quarterly progress filing sign-off", entity: "Sereno Greens",
    current: "Draft", proposed: "Ready to file", reason: "Filing deadline in 8 days; penalty exposure ₹5L.",
    requestedBy: "Compliance Desk", requires: "Director approval", raised: iso(-1), impact: -500000,
  },
  {
    id: "APR-9005", kind: "Pricing", title: "Floor premium revision", entity: "Northgate Towers · Tower B floors 9-14",
    current: "0.35%/floor", proposed: "0.5%/floor", reason: "High-floor absorption 2.3x faster than low floors.",
    requestedBy: "AI Pricing Engine", requires: "Sales Manager approval", raised: iso(-4), impact: 2800000,
  },
  {
    id: "APR-9006", kind: "Other", title: "Lead attribution review", entity: "LEAD-10482 · Rahul Sharma",
    current: "ABC Realty", proposed: "Rajan Properties", reason: "Duplicate registration within 30-day attribution window.",
    requestedBy: "Rajan Properties", requires: "Channel Head approval", raised: iso(-2), impact: 0,
  },
  {
    id: "APR-9007", kind: "Commission", title: "Disputed commission recalculation", entity: "Skyline Realty · BK-1042",
    current: "1.75%", proposed: "2.25%", reason: "Platinum tier slab applies from Q2; partner raised dispute.",
    requestedBy: "Skyline Realty", requires: "Channel Head approval", raised: iso(-5), impact: -190000,
  },
  {
    id: "APR-9008", kind: "Discount", title: "Bulk deal — 4 units", entity: "Emerald Bay · Tower A",
    current: "₹0", proposed: "₹9.6L total", reason: "Corporate bulk booking of 4 units by Nexa Consultants.",
    requestedBy: "Kavya Nair", requires: "Director approval", raised: iso(-1), impact: -960000,
  },
  {
    id: "APR-9009", kind: "Pricing", title: "Launch pricing for Tower D", entity: "Vertex One · Tower D",
    current: "₹7,500/sq.ft", proposed: "₹7,800/sq.ft", reason: "Micro-market comparables cleared at ₹7,950/sq.ft in last 45 days.",
    requestedBy: "AI Pricing Engine", requires: "Director approval", raised: iso(-6), impact: 14500000,
  },
  {
    id: "APR-9010", kind: "RERA", title: "Extension application", entity: "Harbour Crest",
    current: "Dec 2026", proposed: "Jun 2027", reason: "Approval delay on OC; extension filing required.",
    requestedBy: "Compliance Desk", requires: "Director approval", raised: iso(-8), impact: -1200000,
  },
  {
    id: "APR-9011", kind: "Other", title: "Refund on cancellation", entity: "BK-1073 · Priya Mehta",
    current: "₹0", proposed: "₹6.4L", reason: "Loan rejection; cancellation clause 4.2 applies with 2% deduction.",
    requestedBy: "Finance Ops", requires: "Finance Controller approval", raised: iso(-3), impact: -640000,
  },
  {
    id: "APR-9012", kind: "Commission", title: "Q3 incentive slab release", entity: "12 Platinum partners",
    current: "₹0", proposed: "₹18.5L", reason: "Quarterly incentive slabs achieved across 12 partners.",
    requestedBy: "Channel Ops", requires: "Finance Controller approval", raised: iso(-2), impact: -1850000,
  },
];

export const auditLog: AuditEntry[] = Array.from({ length: 60 }, (_, i) => {
  const templates = [
    { action: "Changed unit price", entity: `A-${1200 + i}`, oldValue: "₹78L", newValue: "₹82L" },
    { action: "Approved discount", entity: `BK-${1000 + (i % 96)}`, oldValue: "₹1.2L", newValue: "₹2.4L" },
    { action: "Reassigned lead", entity: `LEAD-${10400 + i}`, oldValue: "Neha Verma", newValue: "Amit Sharma" },
    { action: "Released commission", entity: `COM-${500 + i}`, oldValue: "Payable", newValue: "Paid" },
    { action: "Updated RERA filing", entity: projects[i % projects.length]!.name, oldValue: "Draft", newValue: "Filed" },
    { action: "Verified document", entity: `DOC-${3000 + i}`, oldValue: "Needs Review", newValue: "Verified" },
    { action: "Changed unit status", entity: `B-${700 + i}`, oldValue: "Hold", newValue: "Booked" },
  ];
  const t = templates[i % templates.length];
  return {
    id: `AUD-${8000 + i}`,
    time: iso(-i * 0.21),
    user: pick([...EXECS, "Rohan Pillai", "Finance Ops", "AI Pricing Engine"]),
    ...t,
    approval: chance(0.7) ? `Approved by ${pick(["Rohan Pillai", "Sales Head", "Finance Controller"])}` : "Not required",
  };
});

export const reraItems: ReraItem[] = projects.slice(0, 10).flatMap((p, i) => [
  {
    id: `RERA-${i}-1`, projectId: p.id, task: "Quarterly progress filing", authority: `${p.city} RERA`,
    due: iso(int(2, 26)), severity: i < 3 ? "High" : i < 6 ? "Medium" : "Low",
    penalty: int(1, 8) * 100000, status: "Upcoming",
  },
  {
    id: `RERA-${i}-2`, projectId: p.id, task: "Annual audit certificate", authority: `${p.city} RERA`,
    due: iso(-int(1, 20)), severity: i % 3 === 0 ? "High" : "Medium",
    penalty: int(2, 12) * 100000, status: i % 4 === 0 ? "Overdue" : "Completed",
  },
]);

export const possessionItems: PossessionItem[] = Array.from({ length: 34 }, (_, i) => {
  const b = bookings[i % bookings.length]!;
  const unit = units.find((u) => u.id === b.unitId)!;
  const stages = ["Construction", "Snagging", "Final Payment", "Possession Ready", "Handover", "RWA"] as const;
  const stage = stages[i % stages.length]!;
  return {
    id: `POS-${i}`,
    customer: b.customer,
    unitCode: unit.code,
    projectId: b.projectId,
    stage,
    completion: 45 + stages.indexOf(stage) * 10 + int(0, 8),
    snags: stage === "Snagging" ? int(2, 14) : int(0, 3),
    handoverDate: iso(int(20, 360)),
  };
});

/* ---------- Aggregates & AI intelligence ---------- */

export const totals = {
  revenue: projects.reduce((s, p) => s + p.revenue, 0),
  bookings: 2148,
  leads: 10248,
  customers: 2014,
  partners: 182,
  units: 5120,
  available: projects.reduce((s, p) => s + p.available, 0),
  collections: payments.reduce((s, p) => s + p.paid, 0),
  outstanding: payments.reduce((s, p) => s + (p.due - p.paid), 0),
  atRisk: payments.filter((p) => p.risk === "High").reduce((s, p) => s + (p.due - p.paid), 0),
  conversion: 8.4,
};

export const salesTrend = [
  "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
].map((month, i) => ({
  month,
  bookings: 78 + Math.round(Math.sin(i / 2) * 18) + i * 4,
  siteVisits: 240 + Math.round(Math.cos(i / 3) * 40) + i * 9,
}));

export const revenueByProject = projects
  .slice(0, 7)
  .map((p) => ({ name: p.name.replace("Estatum ", ""), revenue: Math.round(p.revenue / 10000000) }))
  .sort((a, b) => b.revenue - a.revenue);

export const inventoryDistribution = [
  { name: "Available", value: units.filter((u) => u.status === "Available").length },
  { name: "Hold", value: units.filter((u) => u.status === "Hold").length },
  { name: "Booked", value: units.filter((u) => u.status === "Booked").length },
  { name: "Sold", value: units.filter((u) => u.status === "Sold").length },
];

export const collectionsTrend = salesTrend.map((s, i) => ({
  month: s.month,
  expected: 42 + i * 3.4,
  received: 38 + i * 3.1 - (i % 3 === 0 ? 4 : 0),
}));

export const funnel = [
  { stage: "Leads", value: 10248 },
  { stage: "Qualified", value: 4312 },
  { stage: "Site Visits", value: 2186 },
  { stage: "Negotiation", value: 1104 },
  { stage: "Bookings", value: 862 },
];

export interface BriefItem {
  id: string;
  severity: "critical" | "warning" | "info" | "positive";
  headline: string;
  detail: string;
  to: string;
}

export const aiBrief: BriefItem[] = [
  { id: "b1", severity: "critical", headline: "₹2.4 Cr collections at risk", detail: "38 milestones with >65% delay probability across 6 projects", to: "/payments" },
  { id: "b2", severity: "warning", headline: "17 hot leads have no follow-up", detail: "Average score 84 · no activity logged in 5+ days", to: "/leads" },
  { id: "b3", severity: "warning", headline: "3 RERA deadlines within 7 days", detail: "Penalty exposure ₹14L if filings slip", to: "/rera" },
  { id: "b4", severity: "info", headline: "₹18.5L commissions awaiting approval", detail: "12 platinum partners, Q3 incentive slab", to: "/approvals" },
  { id: "b5", severity: "positive", headline: "Tower B demand increased 23%", detail: "Pricing engine recommends +₹300/sq.ft — approval required", to: "/ai-insights" },
];

export interface Insight {
  id: string;
  category: "Lead Intelligence" | "Collection Risk" | "Pricing Intelligence" | "Sales Forecast" | "Anomaly Detection";
  title: string;
  prediction: string;
  confidence: number;
  reasons: string[];
  action: string;
  approval: string;
  severity: "critical" | "warning" | "info" | "positive";
}

export const insights: Insight[] = [
  {
    id: "AI-01", category: "Lead Intelligence", title: "17 hot leads decaying",
    prediction: "62% of these leads will go cold within 6 days without contact", confidence: 88,
    reasons: ["Average score 84 with no activity in 5+ days", "2 site visits completed for 9 of them", "Historic decay curve for this cohort"],
    action: "Assign follow-up calls today to Amit Sharma and Kavya Nair",
    approval: "No approval required — operational action", severity: "warning",
  },
  {
    id: "AI-02", category: "Collection Risk", title: "₹2.4 Cr collections at risk",
    prediction: "38 milestones likely to slip past due date this quarter", confidence: 79,
    reasons: ["Repeat delay behaviour on 21 accounts", "Loan disbursement pending for 11 customers", "No response to last 2 reminders on 14 accounts"],
    action: "Trigger relationship-manager calls for the top 12 exposures",
    approval: "No approval required — operational action", severity: "critical",
  },
  {
    id: "AI-03", category: "Pricing Intelligence", title: "Tower B price revision",
    prediction: "₹7,800/sq.ft clears at current absorption without velocity loss", confidence: 82,
    reasons: ["Demand up 18% over 30 days", "Available inventory down 12%", "Comparables cleared at ₹7,950/sq.ft"],
    action: "Raise price from ₹7,500 to ₹7,800/sq.ft",
    approval: "Requires Sales Manager approval", severity: "positive",
  },
  {
    id: "AI-04", category: "Sales Forecast", title: "Q4 bookings forecast",
    prediction: "268 bookings (±19) worth ₹214 Cr, 8% above plan", confidence: 74,
    reasons: ["Site-visit-to-booking ratio improving 4 months straight", "Festive season uplift in 3 micro-markets", "Channel partner pipeline up 22%"],
    action: "Pre-release 60 Tower D units to hold price momentum",
    approval: "Requires Director approval", severity: "info",
  },
  {
    id: "AI-05", category: "Anomaly Detection", title: "Conversion drop — Amit Sharma",
    prediction: "Conversion rate dropped 42% against 90-day baseline", confidence: 91,
    reasons: ["Site visits stable, bookings down 11", "Longest response time in team (7.4 hrs)", "Concentrated in Estatum Meridian leads"],
    action: "Schedule pipeline review with sales manager",
    approval: "No approval required — investigation", severity: "warning",
  },
  {
    id: "AI-06", category: "Anomaly Detection", title: "Unusual discount pattern — Tower B",
    prediction: "Average discount 3.2x above project baseline", confidence: 86,
    reasons: ["Baseline discount ₹1.2L, current ₹3.8L", "9 of 11 approvals by the same manager", "No corresponding demand drop observed"],
    action: "Review discount approvals for the last 30 days",
    approval: "Requires Sales Head review", severity: "critical",
  },
];

/* ---------- Lookups ---------- */

export const projectById = (id: string) => projects.find((p) => p.id === id);
export const projectName = (id: string) => projectById(id)?.name ?? "—";
export const unitById = (id: string) => units.find((u) => u.id === id);
export const partnerById = (id?: string) => (id ? partners.find((p) => p.id === id) : undefined);
export const partnerName = (id?: string) => partnerById(id)?.firm ?? "Direct";
export const leadById = (id: string) => leads.find((l) => l.id === id);
export const bookingById = (id: string) => bookings.find((b) => b.id === id);
