import { useEffect, useRef, useState } from "react";
import { toPoints } from "@/lib/incidents";

/**
 * Turns a free-text report into a clean handover list.
 *
 * Local splitting shows instantly; a debounced AI pass then rewrites messy or
 * unpunctuated text (often voice transcription) into short, ordered points.
 */
export function useHandoffPoints(text: string) {
  const local = toPoints(text);
  const [aiPoints, setAiPoints] = useState<string[] | null>(null);
  const [tidying, setTidying] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed.length < 12) {
      setAiPoints(null);
      setTidying(false);
      return;
    }

    const id = ++seq.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setTidying(true);
      try {
        const res = await fetch("/api/points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => ({}))) as { points?: string[] };
        if (id === seq.current && res.ok && Array.isArray(data.points) && data.points.length) {
          setAiPoints(data.points);
        }
      } catch {
        /* keep the local split as the fallback */
      } finally {
        if (id === seq.current) setTidying(false);
      }
    }, 1200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text]);

  return { points: aiPoints ?? local, assisted: aiPoints !== null, tidying };
}
