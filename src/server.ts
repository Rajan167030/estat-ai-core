import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  handleExotelWebhook,
  handleTtsAudioRequest,
} from "./server/calling-agent/live/exotel-webhook";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // Third-party telephony webhooks — plain HTTP endpoints, not TanStack
    // Start server functions (Exotel POSTs form-encoded bodies and expects
    // raw XML back, which server functions don't speak). Intercepted here,
    // before the SPA/SSR handler, since this is the one place guaranteed to
    // see every request regardless of TanStack Start's routing internals.
    const url = new URL(request.url);
    if (url.pathname === "/api/exotel-webhook") {
      return handleExotelWebhook(request).catch((error) => {
        console.error(error);
        return new Response(
          '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Internal error.</Say><Hangup/></Response>',
          {
            headers: { "content-type": "text/xml; charset=utf-8" },
          },
        );
      });
    }
    if (url.pathname.startsWith("/api/tts-audio/")) {
      return handleTtsAudioRequest(request).catch((error) => {
        console.error(error);
        return new Response("Internal error", { status: 500 });
      });
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
