import { leads, projectName, TODAY, type Lead } from "./data";

/* ------------------------------------------------------------------ */
/* Deterministic helpers (same style as data.ts)                       */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(90620261);
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const chance = (p: number) => rnd() < p;
const iso = (hoursOffset: number) => new Date(TODAY.getTime() + hoursOffset * 3600_000).toISOString();

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type CampaignStatus = "Running" | "Paused" | "Scheduled" | "Completed";
export type CallStatus = "Queued" | "Dialling" | "In progress" | "Completed" | "No answer" | "Failed";
export type CallOutcome =
  | "Site visit booked"
  | "Follow-up scheduled"
  | "Interested"
  | "Not interested"
  | "Callback requested"
  | "Wrong number"
  | "No answer";
export type Sentiment = "Positive" | "Neutral" | "Negative";

export interface Campaign {
  id: string;
  name: string;
  goal: string;
  projectId: string;
  status: CampaignStatus;
  language: "Hindi" | "English" | "Hinglish" | "Marathi";
  voice: string;
  totalLeads: number;
  called: number;
  connected: number;
  siteVisits: number;
  avgDurationSec: number;
  window: string;
  script: string;
  requiresApproval: string;
}

export interface TranscriptTurn {
  speaker: "Agent" | "Lead";
  at: string;
  text: string;
}

export interface CallRecord {
  id: string;
  campaignId: string;
  leadId: string;
  leadName: string;
  phone: string;
  projectId: string;
  status: CallStatus;
  outcome?: CallOutcome;
  sentiment?: Sentiment;
  intentScore: number;
  durationSec: number;
  startedAt: string;
  attempt: number;
  summary: string;
  nextAction: string;
  transcript: TranscriptTurn[];
  objections: string[];
  handoffTo?: string;
}

/* ------------------------------------------------------------------ */
/* Campaigns                                                           */
/* ------------------------------------------------------------------ */

const CAMPAIGN_SEED: Array<[string, string, CampaignStatus, Campaign["language"], string]> = [
  ["Hot lead first-touch", "Qualify and book a site visit within 24h of enquiry", "Running", "Hinglish", "Aarohi (female, warm)"],
  ["Site-visit reminder", "Confirm scheduled visits and reduce no-shows", "Running", "Hindi", "Kabir (male, calm)"],
  ["Cold lead re-activation", "Re-open dormant enquiries older than 60 days", "Paused", "Hinglish", "Aarohi (female, warm)"],
  ["Payment reminder — courtesy", "Remind on upcoming milestone dues, no negotiation", "Running", "English", "Nisha (female, formal)"],
  ["Tower B launch outreach", "Announce new inventory to matching budget bands", "Scheduled", "Marathi", "Kabir (male, calm)"],
  ["Post-visit feedback", "Capture feedback and objections after a site visit", "Completed", "Hinglish", "Aarohi (female, warm)"],
];

export const campaigns: Campaign[] = CAMPAIGN_SEED.map(([name, goal, status, language, voice], i) => {
  const totalLeads = int(180, 1400);
  const called = status === "Scheduled" ? 0 : Math.round(totalLeads * (status === "Completed" ? 1 : rnd() * 0.6 + 0.25));
  const connected = Math.round(called * (rnd() * 0.25 + 0.55));
  return {
    id: `CMP-${210 + i}`,
    name,
    goal,
    projectId: leads[i * 7]!.projectId,
    status,
    language,
    voice,
    totalLeads,
    called,
    connected,
    siteVisits: Math.round(connected * (rnd() * 0.12 + 0.06)),
    avgDurationSec: int(78, 214),
    window: pick(["10:00 – 19:00 IST", "11:00 – 20:00 IST", "09:30 – 18:30 IST"]),
    script: `Namaste, main ${name.split(" ")[0]} team se bol rahi hoon — aapne ${projectName(leads[i * 7]!.projectId)} ke liye enquiry ki thi. Kya main 2 minute le sakti hoon?`,
    requiresApproval: i === 3 ? "Finance Head approval to mention any amount" : "Sales Manager approval to change script or budget",
  };
});

/* ------------------------------------------------------------------ */
/* Calls                                                               */
/* ------------------------------------------------------------------ */

const OBJECTIONS = [
  "Price above budget",
  "Wants 3BHK, only 2BHK available",
  "Possession date too late",
  "Comparing with competitor project",
  "Loan sanction pending",
  "Travelling this month",
];

const OUTCOMES: CallOutcome[] = [
  "Site visit booked",
  "Follow-up scheduled",
  "Interested",
  "Not interested",
  "Callback requested",
  "Wrong number",
  "No answer",
];

function transcriptFor(lead: Lead, outcome: CallOutcome): TranscriptTurn[] {
  const p = projectName(lead.projectId);
  const base: TranscriptTurn[] = [
    { speaker: "Agent", at: "00:00", text: `Namaste ${lead.name.split(" ")[0]} ji, main Estatum Developers se Aarohi bol rahi hoon. Aapne ${p} ke liye enquiry ki thi — 2 minute baat kar sakte hain?` },
    { speaker: "Lead", at: "00:07", text: "Haan boliye, but jaldi — main office mein hoon." },
    { speaker: "Agent", at: "00:11", text: `Bilkul. Aap ${lead.config} dekh rahe the, budget range around ${Math.round(lead.budget / 100000)} lakh. Kya yeh abhi bhi sahi hai?` },
    { speaker: "Lead", at: "00:20", text: "Haan, lekin thoda stretch kar sakta hoon agar possession jaldi ho." },
    { speaker: "Agent", at: "00:26", text: "Samajh gayi. Tower A mein possession December 2026 hai aur waha par corner units available hain." },
  ];
  const tail: Record<string, TranscriptTurn[]> = {
    "Site visit booked": [
      { speaker: "Lead", at: "00:38", text: "Theek hai, weekend pe dekh sakta hoon." },
      { speaker: "Agent", at: "00:42", text: "Saturday 11 baje slot rakh doon? Aapko address WhatsApp par bhej dungi." },
      { speaker: "Lead", at: "00:49", text: "Haan chalega." },
    ],
    "Callback requested": [
      { speaker: "Lead", at: "00:36", text: "Abhi meeting hai, shaam ko call kariye." },
      { speaker: "Agent", at: "00:39", text: "Bilkul, main 7 baje call karti hoon. Dhanyavaad." },
    ],
    "Not interested": [
      { speaker: "Lead", at: "00:35", text: "Maine dusri jagah book kar liya hai." },
      { speaker: "Agent", at: "00:38", text: "Samajh gayi, aapka time dene ke liye dhanyavaad." },
    ],
  };
  return [...base, ...(tail[outcome] ?? [
    { speaker: "Lead" as const, at: "00:36", text: "Details bhej dijiye, main dekh ke batata hoon." },
    { speaker: "Agent" as const, at: "00:40", text: "Ji, brochure aur price sheet WhatsApp kar rahi hoon. Main Thursday follow-up karungi." },
  ])];
}

const liveLeads = leads.slice(0, 6);

export const liveCalls: CallRecord[] = liveLeads.map((lead, i) => {
  const status: CallStatus = i === 0 ? "In progress" : i === 1 ? "Dialling" : "Queued";
  return {
    id: `CALL-${7100 + i}`,
    campaignId: campaigns[i % 4]!.id,
    leadId: lead.id,
    leadName: lead.name,
    phone: lead.phone,
    projectId: lead.projectId,
    status,
    intentScore: lead.score,
    durationSec: status === "In progress" ? 96 : 0,
    startedAt: iso(-0.1 * i),
    attempt: int(1, 3),
    summary:
      status === "In progress"
        ? "Lead is comparing two towers and asking about possession timeline."
        : "Waiting in queue — will dial in call window.",
    nextAction: status === "In progress" ? "Offer Saturday 11:00 site visit slot" : "Dial as per campaign window",
    transcript: status === "In progress" ? transcriptFor(lead, "Interested").slice(0, 5) : [],
    objections: status === "In progress" ? ["Possession date too late"] : [],
  };
});

export const callHistory: CallRecord[] = leads.slice(6, 60).map((lead, i) => {
  const outcome = pick(OUTCOMES);
  const connected = outcome !== "No answer" && outcome !== "Wrong number";
  const sentiment: Sentiment =
    outcome === "Site visit booked" || outcome === "Interested" ? "Positive" : outcome === "Not interested" ? "Negative" : "Neutral";
  return {
    id: `CALL-${7000 + i}`,
    campaignId: campaigns[i % campaigns.length]!.id,
    leadId: lead.id,
    leadName: lead.name,
    phone: lead.phone,
    projectId: lead.projectId,
    status: connected ? "Completed" : outcome === "No answer" ? "No answer" : "Failed",
    outcome,
    sentiment,
    intentScore: lead.score,
    durationSec: connected ? int(45, 320) : 0,
    startedAt: iso(-int(1, 96)),
    attempt: int(1, 4),
    summary: connected
      ? `Discussed ${lead.config} in ${projectName(lead.projectId)}. ${
          outcome === "Site visit booked"
            ? "Site visit confirmed for the weekend."
            : outcome === "Not interested"
              ? "Lead has already booked elsewhere."
              : "Lead asked for price sheet on WhatsApp."
        }`
      : "Call did not connect — number unreachable.",
    nextAction:
      outcome === "Site visit booked"
        ? "Assign site-visit host and send location"
        : outcome === "Callback requested"
          ? "Retry today after 19:00"
          : outcome === "Not interested"
            ? "Mark lead as Lost after manager review"
            : "Send brochure and retry in 2 days",
    transcript: connected ? transcriptFor(lead, outcome) : [],
    objections: connected ? [pick(OBJECTIONS), ...(chance(0.35) ? [pick(OBJECTIONS)] : [])] : [],
    ...(outcome === "Site visit booked" ? { handoffTo: lead.owner } : {}),
  };
});

export const allCalls: CallRecord[] = [...liveCalls, ...callHistory];
export const callById = (id: string) => allCalls.find((c) => c.id === id);
export const campaignById = (id: string) => campaigns.find((c) => c.id === id);

/* ------------------------------------------------------------------ */
/* Aggregates                                                          */
/* ------------------------------------------------------------------ */

const connectedCalls = callHistory.filter((c) => c.status === "Completed");

export const callingTotals = {
  callsToday: 1284,
  connectRate: Math.round((connectedCalls.length / callHistory.length) * 1000) / 10,
  avgDurationSec: Math.round(connectedCalls.reduce((s, c) => s + c.durationSec, 0) / Math.max(connectedCalls.length, 1)),
  siteVisitsBooked: callHistory.filter((c) => c.outcome === "Site visit booked").length + 34,
  humanHandoffs: callHistory.filter((c) => c.handoffTo).length,
  minutesUsed: 4820,
  minutesQuota: 8000,
};

export const outcomeBreakdown = OUTCOMES.map((o) => ({
  outcome: o,
  count: callHistory.filter((c) => c.outcome === o).length,
})).sort((a, b) => b.count - a.count);

export const hourlyCalls = [
  { hour: "10:00", calls: 96, connected: 61 },
  { hour: "11:00", calls: 148, connected: 98 },
  { hour: "12:00", calls: 132, connected: 84 },
  { hour: "13:00", calls: 74, connected: 39 },
  { hour: "14:00", calls: 118, connected: 71 },
  { hour: "15:00", calls: 164, connected: 112 },
  { hour: "16:00", calls: 172, connected: 121 },
  { hour: "17:00", calls: 158, connected: 109 },
  { hour: "18:00", calls: 142, connected: 96 },
  { hour: "19:00", calls: 80, connected: 52 },
];

export interface CallingInsight {
  title: string;
  prediction: string;
  confidence: number;
  reasons: string[];
  action: string;
  approval: string;
}

export const callingInsights: CallingInsight[] = [
  {
    title: "Best calling window is shifting later",
    prediction: "Moving Hot-lead dialling to 15:00–18:00 should lift connect rate by ~9%.",
    confidence: 84,
    reasons: ["Connect rate 68% after 15:00 vs 54% before noon", "Drop-off before 30s is 2.1x higher in morning slots", "Sample: 4,120 calls in last 14 days"],
    action: "Shift 'Hot lead first-touch' window to 15:00–19:00 IST",
    approval: "Sales Manager approval required",
  },
  {
    title: "Objection cluster: possession timeline",
    prediction: "31% of negative-sentiment calls end on possession date objections for Tower C.",
    confidence: 79,
    reasons: ["148 of 476 negative calls mention possession", "Concentrated in 2BHK enquiries", "Competitor project offers Mar-2026 handover"],
    action: "Add approved possession-milestone rebuttal to the script",
    approval: "Sales Manager + Compliance sign-off on script text",
  },
  {
    title: "Callback backlog building",
    prediction: "212 callback-requested leads will age past SLA within 48 hours.",
    confidence: 91,
    reasons: ["Evening retry capacity is 60% booked", "Average callback wait is now 31 hours", "SLA target is 12 hours"],
    action: "Allocate an extra evening agent line for callbacks",
    approval: "Operations Head approval on added call minutes",
  },
];
