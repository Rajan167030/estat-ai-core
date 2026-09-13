import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { extractDocumentFields } from "../server/documents/extract";
import type { DocumentRecord } from "@/lib/mock/data";

export const runDocumentExtraction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      imageDataUri: z.string(),
      documentType: z.string().optional(),
      customer: z.string().optional(),
      projectId: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<DocumentRecord> => {
    const result = await extractDocumentFields(data.imageDataUri, data.documentType);
    const avgConfidence = result.fields.length
      ? Math.round(result.fields.reduce((s, f) => s + f.confidence, 0) / result.fields.length)
      : 0;
    const verification: DocumentRecord["verification"] =
      avgConfidence >= 85 ? "Verified" : avgConfidence >= 60 ? "Needs Review" : "Rejected";

    return {
      id: `DOC-LIVE-${Date.now()}`,
      type: result.documentType ?? data.documentType ?? "Unknown document",
      customer: data.customer ?? "Uploaded document",
      projectId: data.projectId ?? "",
      uploaded: new Date().toISOString(),
      verification,
      confidence: avgConfidence,
      fields: result.fields,
    };
  });
