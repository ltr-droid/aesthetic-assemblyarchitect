import { useCallback, useRef, useState } from "react";

/** Encode Float32 PCM chunks into a 16-bit mono WAV blob at 16 kHz. */
function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const input = new Float32Array(total);
  let o = 0;
  for (const c of chunks) {
    input.set(c, o);
    o += c.length;
  }

  const target = 16000;
  const ratio = sampleRate / target;
  const outLen = Math.floor(input.length / ratio);
  const samples = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const s = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)] ?? 0));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const str = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, target, true);
  view.setUint32(28, target * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, samples.length * 2, true);
  new Int16Array(buffer, 44).set(samples);

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Records microphone audio and transcribes it server-side through the
 * Lovable AI speech-to-text endpoint (`/api/transcribe`).
 */
export function useVoiceInput(onTranscript: (text: string) => void) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;
  const stopRef = useRef<(() => Promise<void>) | null>(null);

  const start = useCallback(async () => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access is needed to record.");
      return;
    }

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const node = ctx.createScriptProcessor(4096, 1, 1);
    const pcm: Float32Array[] = [];
    node.onaudioprocess = (e) => pcm.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    source.connect(node);
    node.connect(ctx.destination);
    setRecording(true);

    stopRef.current = async () => {
      stream.getTracks().forEach((t) => t.stop());
      node.disconnect();
      source.disconnect();
      const blob = encodeWav(pcm, ctx.sampleRate);
      await ctx.close();
      setRecording(false);

      if (blob.size < 4096) {
        setError("That recording was empty — please try again.");
        return;
      }

      setTranscribing(true);
      try {
        const body = new FormData();
        body.append("file", blob, "recording.wav");
        const res = await fetch("/api/transcribe", { method: "POST", body });
        const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
        if (!res.ok) {
          setError(data.error || "Could not transcribe that recording.");
          return;
        }
        const text = (data.text || "").trim();
        if (!text) setError("Nothing was picked up — try speaking closer to the mic.");
        else cbRef.current(text);
      } catch {
        setError("Could not reach the transcription service.");
      } finally {
        setTranscribing(false);
      }
    };
  }, []);

  const stop = useCallback(async () => {
    const fn = stopRef.current;
    stopRef.current = null;
    if (fn) await fn();
  }, []);

  const toggle = useCallback(() => {
    if (recording) void stop();
    else void start();
  }, [recording, start, stop]);

  return { recording, transcribing, error, toggle };
}
