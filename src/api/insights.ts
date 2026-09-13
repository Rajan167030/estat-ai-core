import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateAllInsights } from "../server/insights/generate";
import {
  generateProjectPricing,
  generateLeadInsight,
  generatePaymentRiskInsight,
  generateCallRecommendation,
} from "../server/insights/per-item";
import { generateCallingIntelligence } from "../server/insights/calling-intelligence";

export const runAllInsights = createServerFn({ method: "POST" }).handler(async () =>
  generateAllInsights(),
);

export const runProjectPricing = createServerFn({ method: "POST" })
  .validator(z.object({ projectId: z.string() }))
  .handler(async ({ data }) => generateProjectPricing(data.projectId));

export const runLeadInsight = createServerFn({ method: "POST" })
  .validator(z.object({ leadId: z.string() }))
  .handler(async ({ data }) => generateLeadInsight(data.leadId));

export const runPaymentRiskInsight = createServerFn({ method: "POST" })
  .validator(z.object({ paymentId: z.string() }))
  .handler(async ({ data }) => generatePaymentRiskInsight(data.paymentId));

export const runCallRecommendation = createServerFn({ method: "POST" })
  .validator(z.object({ callId: z.string() }))
  .handler(async ({ data }) => generateCallRecommendation(data.callId));

export const runCallingIntelligence = createServerFn({ method: "POST" }).handler(async () =>
  generateCallingIntelligence(),
);
