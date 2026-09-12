import { groqRequest, hasGroqKey } from "../groq/client";

export interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
}

export interface DocumentExtractionResult {
  documentType?: string;
  fields: ExtractedField[];
}

const SYSTEM_PROMPT = `You extract structured fields from a real-estate KYC/agreement document image for the Estatum ERP.
Reply with ONLY a compact JSON object: {"documentType": string, "fields": [{"label": string, "value": string, "confidence": number}]}.
"confidence" (0-100) is YOUR honest estimate of how certain you are the value is read correctly and unambiguously — be conservative, not optimistic. If a field is illegible or absent, still include it with your best partial reading and a low confidence rather than omitting it.`;

function parseExtractionJson(text: string): DocumentExtractionResult {
  let parsed: { documentType?: unknown; fields?: unknown };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = match ? (JSON.parse(match[0]) as typeof parsed) : {};
  }

  const fields = Array.isArray(parsed.fields)
    ? (parsed.fields as unknown[]).map((f) => {
        const rec = f as Record<string, unknown>;
        return {
          label: String(rec["label"] ?? ""),
          value: String(rec["value"] ?? ""),
          confidence: Math.min(100, Math.max(0, Number(rec["confidence"] ?? 0))),
        };
      })
    : [];

  return {
    ...(parsed.documentType ? { documentType: String(parsed.documentType) } : {}),
    fields,
  };
}

/**
 * Groq vision path — opt-in only. As of writing, this account's Groq model
 * list (GET /openai/v1/models) has no vision-capable model at all, so
 * there's no safe default to fall back to; set GROQ_VISION_MODEL once Groq
 * ships one you have access to (check console.groq.com/docs/vision).
 */
async function extractViaGroq(
  imageUrl: string,
  documentTypeHint: string | undefined,
  model: string,
): Promise<DocumentExtractionResult> {
  const res = await groqRequest("/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: documentTypeHint
                ? `Document type: ${documentTypeHint}`
                : "Identify the document type and extract its fields.",
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok)
    throw new Error(`Groq vision API (${model}) responded ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return parseExtractionJson(data.choices?.[0]?.message?.content ?? "{}");
}

function parseDataUri(dataUri: string): { mediaType: string; base64: string } | undefined {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/s);
  return match ? { mediaType: match[1]!, base64: match[2]! } : undefined;
}

/**
 * Google Gemini vision path — used when there's no Groq vision model
 * available. Gemini's free tier (ai.google.dev) is generous and its vision
 * quality is strong. Only accepts data: URIs (base64), which is what the
 * upload flow sends.
 */
async function extractViaGemini(
  imageUrl: string,
  documentTypeHint: string | undefined,
): Promise<DocumentExtractionResult> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("extractViaGemini requires GEMINI_API_KEY to be set.");

  const parsed = parseDataUri(imageUrl);
  if (!parsed)
    throw new Error("Gemini vision needs a data: URI (base64 image) — got a plain URL instead.");

  const model = process.env["GEMINI_VISION_MODEL"] ?? "gemini-2.0-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\n${documentTypeHint ? `Document type: ${documentTypeHint}` : "Identify the document type and extract its fields."}`,
              },
              { inline_data: { mime_type: parsed.mediaType, data: parsed.base64 } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1200 },
      }),
    },
  );
  if (!res.ok)
    throw new Error(`Gemini vision API (${model}) responded ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return parseExtractionJson(text);
}

/**
 * Extracts fields from a document image. Prefers Groq if GROQ_VISION_MODEL
 * is explicitly set (this account has no vision model by default — see
 * extractViaGroq), otherwise falls back to Gemini vision when
 * GEMINI_API_KEY is available. Takes a data: URI (from the upload flow) or,
 * for the Groq path only, a publicly fetchable image URL.
 *
 * There's no file-upload feature in this app yet beyond the Documents page
 * upload button — test standalone with scripts/extract-document.ts.
 */
export async function extractDocumentFields(
  imageUrl: string,
  documentTypeHint?: string,
): Promise<DocumentExtractionResult> {
  const groqVisionModel = process.env["GROQ_VISION_MODEL"];
  if (groqVisionModel) {
    if (!hasGroqKey())
      throw new Error("GROQ_API_KEY (or GROQ_API_KEYS) is required to use GROQ_VISION_MODEL.");
    return extractViaGroq(imageUrl, documentTypeHint, groqVisionModel);
  }
  if (process.env["GEMINI_API_KEY"]) {
    return extractViaGemini(imageUrl, documentTypeHint);
  }
  throw new Error(
    "No vision provider configured for document extraction: this Groq account currently has no vision model (set GROQ_VISION_MODEL if that changes), so set GEMINI_API_KEY to use Google Gemini vision instead.",
  );
}
