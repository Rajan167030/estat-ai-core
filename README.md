# Estatum Insights Hub

ESTATUM ERP — FRONTEND IMPLEMENTATION MASTER PROMPT

You are a senior product designer and frontend engineer.

Build a production-quality frontend for Estatum ERP, an AI-powered real-estate business operating system for builders and developers.

The product manages the complete real-estate lifecycle:

Lead → Sales → Booking → Payment → Channel Partner → Commission → Documents → RERA → Possession → Customer Support

The frontend must feel like a serious enterprise SaaS product, not a generic admin dashboard.

1. TECH STACK

Use:

Next.js 15+

TypeScript

Tailwind CSS

shadcn/ui

Lucide React icons

TanStack Query

React Hook Form

Zod

Recharts for charts

Framer Motion only for subtle transitions

Use reusable components and a clean feature-based architecture.

Do NOT use unnecessary libraries.

2. DESIGN LANGUAGE

The visual style should combine:

Modern enterprise SaaS + premium real-estate technology + AI intelligence.

Avoid:

Excessive gradients

Glassmorphism everywhere

Neon colors

Huge rounded cards

Excessive animations

Overly colorful dashboards

Generic AI-looking interfaces

The product should look trustworthy, operational and premium.

Think:

Linear + Stripe Dashboard + modern enterprise CRM, adapted for real estate.

3. COLOR SYSTEM

Use these colors consistently.

Primary

Deep Navy:

#0B1220

Use for:

Sidebar

Primary dark UI

Important navigation elements

Primary Accent

Electric Blue:

#2563EB

Use for:

Primary buttons

Active states

Links

Important metrics

Selected navigation

Secondary

Teal:

#0F766E

Use sparingly for:

Positive business intelligence

Secondary actions

Special insights

Success

#16A34A

Warning

#D97706

Danger

#DC2626

Background

#F8FAFC

Card

#FFFFFF

Main Text

#0F172A

Secondary Text

#64748B

Borders

#E2E8F0

AI highlight

Use a subtle blue-violet:

#6366F1

ONLY for AI-generated recommendations, insights and intelligence.

Do not make the entire UI purple.

4. TYPOGRAPHY

Use:

Inter

Fallback:

system-ui, sans-serif

Typography should be clean and compact.

Dashboard numbers:

Large

Bold

High contrast

Body:

14–15px

Labels:

12–13px

Page headings:

24–30px

Do not use oversized marketing typography inside the ERP.

5. GLOBAL LAYOUT

Desktop-first enterprise application.

Structure:

┌─────────────────────────────────────────────────────────┐
│ Top Header                                              │
│ Search | Notifications | Approvals | Profile            │
├───────────────┬─────────────────────────────────────────┤
│               │                                         │
│ Sidebar       │ Main Content                            │
│               │                                         │
│ Dashboard     │                                         │
│ Leads         │                                         │
│ Projects      │                                         │
│ Inventory     │                                         │
│ Bookings      │                                         │
│ Payments      │                                         │
│ Partners      │                                         │
│ Commissions   │                                         │
│ Documents     │                                         │
│ RERA          │                                         │
│ Possession    │                                         │
│ Customers     │                                         │
│ AI Insights   │                                         │
│ Approvals     │                                         │
│ Audit Log     │                                         │
│               │                                         │
└───────────────┴─────────────────────────────────────────┘


Sidebar:

Width: approximately 240px

Deep navy background

Estatum logo at top

Active item uses subtle blue background

Icons from Lucide

Clear grouping with section labels

6. GLOBAL TOP BAR

Top bar should include:

Universal Search

Placeholder:

Search leads, customers, units, projects...

Shortcut:

⌘ K

Search should be a command-palette style component.

Search results can include:

Rahul Sharma
Lead · Project A

A-1204
Unit · Tower A

ABC Realty
Channel Partner

Booking #BK-1028


Notifications

Show:

Payment alerts

Follow-up alerts

Approval requests

RERA deadlines

AI alerts

Approval Counter

Example:

12 Pending Approvals

Click opens approval center.

User Menu

Show:

Name

Role

Organization

Settings

Logout

7. DASHBOARD — AI BUSINESS BRIEF

This is the most important screen.

Route:

/dashboard

Top:

Good morning, Rajan

Here's what needs your attention today.


Main hero section:

AI BUSINESS BRIEF

Create a premium but compact AI panel.

Example:

AI BUSINESS BRIEF

14 high-priority actions require attention

🔴 ₹2.4 Cr collections at risk
17 hot leads have no follow-up
3 RERA deadlines within 7 days
₹18.5L commissions awaiting approval
Tower B demand increased 23%


Each item should be clickable.

Do not make this look like a chatbot.

It is an AI-generated executive intelligence panel.

Dashboard KPI cards

Show:

Total Revenue

Bookings

Collections

Available Inventory

Active Leads

Conversion Rate

Each card should contain:

Metric

Current value

Percentage change

Small trend indicator

Example:

TOTAL BOOKINGS

128

↑ 14.2%

vs last month


Dashboard charts

Use Recharts.

Charts:

Sales Trend

Line chart:

Bookings over time.

Revenue by Project

Bar chart.

Inventory Distribution

Donut chart:

Available / Booked / Sold.

Collections

Area/line chart:

Expected vs received.

Sales Funnel

Leads
 ↓
Qualified
 ↓
Site Visits
 ↓
Negotiation
 ↓
Bookings


8. LEAD MANAGEMENT

Route:

/leads

Top section:

Leads

10,248 total leads

[+ Add Lead]
[Import]
[Export]


Filters:

Project

Status

Source

Salesperson

Channel Partner

Lead score

Date

Table columns:

Lead
Project
Source
Score
Status
Assigned To
Last Activity
Next Follow-up
Actions


Use colored status badges:

HOT = subtle red

WARM = amber

COLD = slate

Do not overuse colors.

9. LEAD DETAIL PAGE

Route:

/leads/[id]

Layout:

Left/main:

Customer information

Lead score

Requirements

Timeline

Calls

Site visits

Follow-ups

Right sidebar:

AI INSIGHT

Lead Score
87 / 100

HOT

Why:

✓ Budget matches
✓ 2 site visits
✓ High response rate

Recommended Action

Call within 2 hours

[Assign Follow-up]


Make AI recommendation visually different using subtle indigo background.

10. PROJECTS

Route:

/projects

Project cards/table showing:

Project name

Location

RERA number

Total units

Available

Booked

Sold

Revenue

Construction status

Click project → project detail.

11. PROJECT DETAIL

Tabs:

Overview
Inventory
Sales
Payments
Channel Partners
Documents
RERA
Possession
Analytics


Overview should show:

Revenue

Units sold

Inventory

Sales velocity

Collection

Construction progress

12. INVENTORY

Route:

/inventory

Create a visual real-estate inventory interface.

Filters:

Project

Tower

Floor

Configuration

Status

Price range

Unit grid:

A-101   A-102   A-103   A-104

₹72L    ₹74L    ₹76L    ₹78L

AVAILABLE AVAILABLE BOOKED SOLD


Use:

Available → subtle green

Hold → amber

Booked → blue

Sold → slate

Possession Ready → teal

Click unit opens side drawer.

13. UNIT DETAIL DRAWER

Show:

Unit number

Tower

Floor

Configuration

Area

Facing

Base price

Floor premium

Facing premium

Parking

Final price

Status

Booking details

Customer

Channel partner

Price history

14. PRICING INTELLIGENCE

Inside inventory/project analytics.

Show:

AI PRICING RECOMMENDATION

Current Price
₹7,500/sq.ft

Recommended
₹7,800/sq.ft

Confidence
82%

Demand
↑ 18%

Inventory
↓ 12%


Button:

Request Approval

Never show an AI recommendation as automatically applied.

Clearly display:

AI recommends → Human approves

15. BOOKINGS

Route:

/bookings

Table:

Booking ID

Customer

Project

Unit

Amount

Sales Executive

Channel Partner

Booking Date

Status

Statuses:

Confirmed

Pending

Cancelled

16. BOOKING DETAIL

Show:

Customer

Unit

Project

Booking value

Discount

Payment schedule

Documents

Channel Partner

Commission

Activity timeline

Approval history

17. PAYMENTS

Route:

/payments

Dashboard cards:

Total Collected

Due This Week

Overdue

High Risk

Outstanding

Payment table:

Customer
Unit
Amount Due
Due Date
Paid
Outstanding
Risk
Status


18. COLLECTION RISK

Create a dedicated intelligence panel.

Example:

COLLECTION RISK

Rahul Sharma
Unit A-1204

Outstanding:
₹15L

Risk:
HIGH

Delay probability:
74%

Why?

2 previous delayed payments
₹15L due in 8 days
No response to latest reminder

Recommended:
Call customer today


Use clear visual hierarchy.

Do not use scary red UI everywhere.

19. CHANNEL PARTNERS

Route:

/partners

Dashboard:

Channel Partners

182 Active Partners

Leads
Site Visits
Bookings
Revenue
Commission
Conversion


Leaderboard:

Rank | Partner | Leads | Visits | Bookings | Revenue | Commission


Partner cards should feel like professional business profiles.

20. CHANNEL PARTNER DETAIL

Show:

Partner information

KYC status

Total leads

Site visits

Bookings

Conversion rate

Revenue generated

Commission earned

Paid commission

Pending commission

Lead history

Disputes

21. PARTNER LEAD ATTRIBUTION

Create a dedicated workflow.

Register Lead
      ↓
Duplicate Check
      ↓
Attribution
      ↓
Site Visit
      ↓
Booking
      ↓
Commission


If duplicate:

Show warning modal:

Potential Duplicate Lead

Rahul Sharma

Existing lead found:
LEAD-10482

Previously attributed to:
ABC Realty

[View Existing Lead]

Request Attribution Review


22. COMMISSIONS

Route:

/commissions

Cards:

Total Commission

Pending Approval

Payable

Paid

Disputed

Table:

Partner

Booking

Unit

Commission %

Commission Amount

Status

Approval

23. APPROVAL CENTER

Route:

/approvals

This should be a high-quality workflow UI.

Tabs:

All
Pricing
Discounts
Commissions
RERA
Other


Approval card:

PRICE CHANGE REQUEST

Unit A-1204

Current:
₹78L

Proposed:
₹82L

Reason:
Demand increased 18%

Requested by:
AI Pricing Engine

Requires:
Sales Manager approval

[Reject] [Approve]


Every approval must show:

Who requested

Who approved

When

What changed

Why

24. AUDIT LOG

Route:

/audit

Table:

Time
User
Action
Entity
Old Value
New Value
Approval


Example:

3:21 PM
Amit Sharma

Changed Unit Price

A-1204

₹78L → ₹82L

Approved by Rohan


Provide filtering and search.

25. DOCUMENT MANAGEMENT

Route:

/documents

Show:

Document type

Customer

Project

Upload date

Verification status

AI confidence

AI extraction UI:

DOCUMENT INTELLIGENCE

Customer Name
Rahul Sharma
Confidence 98%

PAN
ABCDE1234F
Confidence 99%

Unit
A-1204
Confidence 73%

⚠ Human verification required


Use yellow warning styling for uncertain fields.

26. RERA

Route:

/rera

Dashboard:

Upcoming deadlines

Overdue

Completed

High penalty exposure

Timeline/calendar:

10 Sept
Filing deadline
HIGH RISK

18 Sept
Project update
MEDIUM

27 Sept
Compliance review
LOW


Add English/Hindi language toggle in the UI.

27. POSSESSION

Route:

/possession

Pipeline:

Construction
 ↓
Snagging
 ↓
Final Payment
 ↓
Possession Ready
 ↓
Handover
 ↓
RWA


Use Kanban-style cards.

Each customer/property should show completion percentage.

28. CUSTOMER PORTAL

Create a separate customer experience.

Routes:

/customer/dashboard

Customer should see:

My Property

A-1204
Tower A

Payment
78% Complete

Documents
9/10 Verified

Construction
94%

Possession
Expected Dec 2026


Tabs:

Overview

Payments

Documents

Construction

Possession

Support

AI Assistant

Customer UI should be simpler than the internal ERP.

29. CUSTOMER AI ASSISTANT

Do NOT make a generic ChatGPT clone.

Create a contextual assistant:

How can we help?

"How much do I still have to pay?"
"When is my next installment?"
"Which documents are pending?"
"When is possession expected?"


Show answers with relevant source records.

30. AI INSIGHTS CENTER

Route:

/ai-insights

Sections:

Lead Intelligence

Collection Risk

Pricing Intelligence

Sales Forecast

Anomaly Detection

Each insight should show:

Prediction

Confidence

Reason

Recommended action

Approval requirement

31. ANOMALY DETECTION

Example cards:

ANOMALY DETECTED

Salesperson:
Amit Sharma

Conversion rate dropped 42%

Compared with:
90-day baseline

Severity:
Medium

[Investigate]


Another:

UNUSUAL DISCOUNT PATTERN

Project:
Tower B

Average discount:
₹1.2L

Current:
₹3.8L

[Review]


32. GLOBAL COMMAND CENTER

Implement a command palette using:

⌘ K

Search everything:

Leads

Customers

Projects

Units

Bookings

Partners

Payments

Documents

RERA

Approvals

Actions:

Create Lead
Create Booking
Search Customer
View Unit
Create Follow-up
Open Approvals


33. RESPONSIVE DESIGN

Desktop is primary.

Also support:

Tablet

Mobile

On mobile:

Sidebar becomes drawer.

Tables become cards where necessary.

Don't simply shrink desktop tables.

34. EMPTY STATES

Every module needs useful empty states.

Example:

No overdue payments

Great — all customers are currently up to date.

[View Payment Dashboard]


Avoid generic:

No data found.

35. LOADING STATES

Use skeleton loaders.

Don't show unnecessary spinners.

Tables:

Skeleton rows.

Dashboard:

Skeleton cards.

Charts:

Skeleton chart blocks.

36. ERROR STATES

Use clear messages.

Example:

Unable to load inventory

We couldn't retrieve the latest inventory data.

[Retry]


Never expose raw backend errors.

37. TOASTS

Use concise notifications:

Success:

Price approval submitted.

Error:

Unable to create booking.

Warning:

This lead may already exist.

38. COMPONENT SYSTEM

Create reusable components:

AppShell
Sidebar
Topbar
SearchCommand
KPI Card
DataTable
StatusBadge
MetricCard
ChartCard
Drawer
Modal
ConfirmDialog
Timeline
ActivityItem
AIInsightCard
ApprovalCard
EmptyState
Skeleton
Toast
FilterBar
DateRangePicker


Don't duplicate components across pages.

39. FRONTEND FOLDER STRUCTURE

Use:

src/
│
├── app/
│   ├── dashboard/
│   ├── leads/
│   ├── projects/
│   ├── inventory/
│   ├── bookings/
│   ├── payments/
│   ├── partners/
│   ├── commissions/
│   ├── documents/
│   ├── rera/
│   ├── possession/
│   ├── customers/
│   ├── approvals/
│   ├── audit/
│   └── ai-insights/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── charts/
│   ├── ai/
│   ├── leads/
│   ├── inventory/
│   ├── payments/
│   └── partners/
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── utils/
│   └── validations/
│
├── hooks/
├── types/
└── config/


40. DATA HANDLING

For now, backend APIs may not exist.

Create a clean mock API/data layer.

DO NOT hardcode random values directly inside UI components.

Use:

mock/
  leads.ts
  projects.ts
  inventory.ts
  payments.ts
  partners.ts
  bookings.ts
  insights.ts


The UI should consume data through services/hooks so the mock layer can later be replaced with the real backend.

41. DEMO DATA

Create realistic interconnected demo data.

Example:

20 Projects
5000 Units
10000 Leads
2000 Customers
200 Channel Partners
5000 Site Visits
2000 Bookings
10000 Payments


Data should be relational.

Example:

Lead:

Rahul Sharma

↓

Project:

Estatum Heights

↓

Unit:

Tower A / A-1204

↓

Booking:

₹80L

↓

Channel Partner:

Rajan Properties

↓

Commission:

₹1.6L

↓

Payment:

₹24L paid

This should appear consistently across all dashboards.

42. IMPORTANT PRODUCT PRINCIPLE

Estatum follows:

AI recommends → Human approves → System executes → Audit records

This must be visible throughout the UI.

Whenever AI makes a recommendation, show:

Recommendation

Reason

Confidence

Recommended action

Human approval status

Never imply that AI autonomously changes financial, pricing or compliance data.

43. UX PRINCIPLES

Prioritize:

Information density

Fast navigation

Searchability

Clear hierarchy

Minimal clicks

Strong tables

Clear status indicators

Predictable workflows

Role-based interfaces

A sales manager should understand their pipeline in under 10 seconds.

A builder should understand business risks in under 10 seconds.

A channel partner should understand their commission status in under 10 seconds.

44. FINAL QUALITY BAR

The final frontend should feel like a product that could be shown to a real Indian real-estate developer.

It should NOT feel like:

A student project

A generic admin template

A flashy AI landing page

A Dribbble concept with no usability

It should feel:

Professional
Trustworthy
Data-driven
Fast
Enterprise-grade
AI-native

Build the UI with realistic business workflows and interconnected data.

Prioritize the dashboard, CRM, inventory, channel partner, booking, payments, approvals and AI intelligence experience first.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b4a6cb12-accd-487d-b7c6-5f3bfccfbdfd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
