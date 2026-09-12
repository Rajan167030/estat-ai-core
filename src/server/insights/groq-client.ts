import { groqRequest } from "../groq/client";

/** Shared insight-narration call — every category asks for a JSON object back and parses it the same way. */
export async function groqChatJson(
  model: string,
  systemPrompt: string,
  userContent: string,
): Promise<Record<string, unknown>> {
  const res = await groqRequest("/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq API (${model}) responded ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as Record<string, unknown>) : {};
  }
}
