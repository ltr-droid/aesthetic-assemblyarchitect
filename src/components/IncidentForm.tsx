import { useEffect, useState } from "react";
import { MapPin, Loader2, Mic, Square, Sparkles } from "lucide-react";
import { useVoiceInput } from "@/lib/useVoiceInput";
import { useHandoffPoints } from "@/lib/useHandoffPoints";



interface Props {
  heading: string;
  hint: string;
  placeholder: string;
  submitLabel: string;
  showLocation?: boolean;
  defaultName?: string;
  onSubmit: (data: { report: string; location: string; name: string }) => Promise<void>;
}

export function IncidentForm({
  heading,
  hint,
  placeholder,
  submitLabel,
  showLocation = false,
  defaultName = "",
  onSubmit,
}: Props) {
  const [report, setReport] = useState("");
  const [location, setLocation] = useState("");
  const [name, setName] = useState(defaultName);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);

  const { recording, transcribing, error: voiceError, toggle } = useVoiceInput((text) =>
    setReport((prev) => (prev ? `${prev.trim()}\n${text}` : text)),
  );

  const { points, assisted, tidying } = useHandoffPoints(report);


  useEffect(() => {
    if (!showLocation || typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }, [showLocation]);

  const disabled = busy || report.trim().length < 3;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (disabled) return;
        setBusy(true);
        try {
          await onSubmit({ report: report.trim(), location: location.trim(), name: name.trim() });
          setReport("");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <h2 className="text-[1.9rem] font-extrabold leading-tight tracking-tight text-foreground">{heading}</h2>
        <p className="mt-2 text-[1rem] leading-relaxed text-muted-foreground">{hint}</p>
      </div>

      <div className="field-soft relative focus-within:field-soft-focus">
        <textarea
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder={placeholder}
          rows={6}
          aria-label={heading}
          className="w-full resize-none bg-transparent p-4 pb-16 text-[1.05rem] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={toggle}
            disabled={transcribing}
            aria-pressed={recording}
            className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition active:scale-[0.97] ${
              recording
                ? "bg-critical text-critical-foreground shadow-[var(--shadow-lift)]"
                : "border border-border bg-card text-foreground hover:border-ring disabled:opacity-40"
            }`}
          >
            {transcribing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : recording ? (
              <Square className="size-4" />
            ) : (
              <Mic className="size-4 text-primary" />
            )}
            {transcribing ? "Writing it up…" : recording ? "Stop" : "Speak"}
          </button>
          <span className="text-xs text-muted-foreground">
            {recording ? "Recording…" : transcribing ? "Transcribing your voice" : "Or tap to speak"}
          </span>
        </div>
      </div>

      {voiceError && (
        <p className="-mt-2 rounded-xl bg-critical-soft px-4 py-2.5 text-sm font-medium text-critical">{voiceError}</p>
      )}

      {points.length > 1 && (
        <div className="tile-soft px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="mono-caps text-muted-foreground">How the next rescuer will read it</span>
            {tidying ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Tidying
              </span>
            ) : assisted ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" /> AI tidied
              </span>
            ) : null}
          </div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {points.map((p, i) => (
              <li key={i} className="flex gap-2 text-[0.95rem] leading-snug text-foreground">
                <span className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-primary" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}



      {showLocation && (
        <label className="block">
          <span className="mono-caps text-muted-foreground">Location</span>
          <div className="field-soft mt-2 flex items-center gap-2 px-4 focus-within:field-soft-focus">
            <MapPin className="size-4 shrink-0 text-primary" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={locating ? "Finding you…" : "Street, landmark or coordinates"}
              className="w-full bg-transparent py-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground/70"
            />
            {locating && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </div>
        </label>
      )}

      <label className="block">
        <span className="mono-caps text-muted-foreground">Your name (optional)</span>
        <div className="field-soft mt-2 px-4 focus-within:field-soft-focus">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="So the next person knows who to thank"
            className="w-full bg-transparent py-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </div>
      </label>

      <div className="sticky bottom-4 z-10">
        <button
          type="submit"
          disabled={disabled}
          className="btn-primary-soft inline-flex h-[3.75rem] w-full items-center justify-center gap-2 text-[1.1rem] font-semibold hover:brightness-[1.06] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {busy && <Loader2 className="size-5 animate-spin" />}
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
      <p className="-mt-1 text-center text-xs text-muted-foreground">
        Plain words are fine. You can add more at any time.
      </p>
    </form>
  );
}
