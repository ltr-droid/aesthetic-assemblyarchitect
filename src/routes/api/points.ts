import { createFileRoute } from "@tanstack/react-router";

const SYSTEM = `You turn messy emergency reports into a short handover list for the next rescuer.
The text may come from voice transcription: it can lack punctuation, be misspelled, be broken English, or be a rough translation.
Rules:
- Return 2-8 short points, each one fact, in plain English, under 12 words.
- Keep the reporter's meaning. Never invent details, diagnoses or vitals.
- Put the most safety-critical facts first (breathing, consciousness, bleeding, danger).
- Sentence case, no trailing punctuation, no numbering or bullet characters.
Respond as json.`;

export const Route = createFileRoute("/api/points")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return Response.json({ error: "AI assist is not configured." }, { status: 500 });

        const { text } = (await request.json().catch(() => ({}))) as { text?: string };
        const input = (text ?? "").trim();
        if (input.length < 3) return Response.json({ points: [] });
        if (input.length > 4000) return Response.json({ error: "That report is too long." }, { status: 400 });

        const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "openai/gpt-5.6-sol",
            stream: true,
            reasoning: { effort: "low", summary: "auto" },
            input: [
              { role: "system", content: [{ type: "input_text", text: SYSTEM }] },
              { role: "user", content: [{ type: "input_text", text: input }] },
            ],
            text: {
              format: {
                type: "json_schema",
                name: "handover_points",
                strict: true,
                schema: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    points: { type: "array", items: { type: "string" } },
                  },
                  required: ["points"],
                },
              },
            },
          }),
        });

        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => "");
          const message =
            res.status === 429
              ? "Too many requests right now — wait a moment and try again."
              : res.status === 402
                ? "AI assist is out of credits."
                : `Could not tidy that up (${res.status}). ${detail.slice(0, 200)}`;
          return Response.json({ error: message }, { status: res.status || 502 });
        }

        // Accumulate the SSE output_text deltas; only the final JSON matters here.
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let out = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const evt = JSON.parse(payload) as { type?: string; delta?: string };
              if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") out += evt.delta;
            } catch {
              /* ignore keep-alive / partial frames */
            }
          }
        }

        let points: string[] = [];
        try {
          const parsed = JSON.parse(out) as { points?: unknown };
          if (Array.isArray(parsed.points)) {
            points = parsed.points
              .filter((p): p is string => typeof p === "string")
              .map((p) => p.replace(/^[-•*\d.\s]+/, "").replace(/[.;]+$/, "").trim())
              .filter(Boolean)
              .slice(0, 8);
          }
        } catch {
          points = [];
        }

        return Response.json({ points });
      },
    },
  },
});
