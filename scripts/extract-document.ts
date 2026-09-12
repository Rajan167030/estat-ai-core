/**
 * Manually test the Groq vision document-extraction service against a real
 * image — a scanned KYC doc, agreement, whatever you have on hand. There's
 * no upload UI in the app yet, so this is the only way to exercise it today.
 *
 * Usage:
 *   bun run scripts/extract-document.ts ./sample-aadhaar.jpg
 *   bun run scripts/extract-document.ts https://example.com/some-scanned-doc.png "PAN Card"
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { extractDocumentFields } from "../src/server/documents/extract";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function toImageUrl(input: string): Promise<string> {
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  const bytes = await readFile(input);
  const mime = MIME_BY_EXT[path.extname(input).toLowerCase()] ?? "image/jpeg";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function main() {
  const [input, documentTypeHint] = process.argv.slice(2);
  if (!input) {
    console.error(
      "Usage: bun run scripts/extract-document.ts <image-path-or-url> [document-type-hint]",
    );
    process.exit(1);
  }

  const imageUrl = await toImageUrl(input);
  console.log(`Extracting fields from ${input}...`);
  const result = await extractDocumentFields(imageUrl, documentTypeHint);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Extraction failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
