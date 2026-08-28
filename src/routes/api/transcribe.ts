import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response(JSON.stringify({ error: "Transcription is not configured." }), { status: 500 });

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || file.size < 2048) {
          return new Response(JSON.stringify({ error: "That recording was empty — please try again." }), { status: 400 });
        }
        if (file.size > 20 * 1024 * 1024) {
          return new Response(JSON.stringify({ error: "Recording is too long. Try a shorter one." }), { status: 413 });
        }

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-transcribe");
        upstream.append("file", file, "recording.wav");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          const message =
            res.status === 429
              ? "Too many requests right now — wait a moment and try again."
              : res.status === 402
                ? "Voice transcription is out of credits."
                : `Could not transcribe that (${res.status}). ${detail.slice(0, 200)}`;
          return new Response(JSON.stringify({ error: message }), { status: res.status });
        }

        const data = (await res.json()) as { text?: string };
        return new Response(JSON.stringify({ text: data.text ?? "" }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
