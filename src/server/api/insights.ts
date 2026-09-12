import { createServerFn } from "@tanstack/react-start";
import { generateAllInsights } from "../insights/generate";

export const runAllInsights = createServerFn({ method: "POST" }).handler(async () =>
  generateAllInsights(),
);
