import { useEffect, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

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
        <h2 className="text-2xl font-bold text-foreground">{heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>

      <textarea
        value={report}
        onChange={(e) => setReport(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full resize-none rounded-xl border border-input bg-card p-4 text-base leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:ring-4 focus:ring-ring/15"
      />

      {showLocation && (
        <label className="block">
          <span className="mono-caps text-muted-foreground">Location</span>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-input bg-card px-3">
            <MapPin className="size-4 shrink-0 text-primary" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={locating ? "Finding you…" : "Street, landmark or coordinates"}
              className="w-full bg-transparent py-3 text-base text-foreground outline-none placeholder:text-muted-foreground/70"
            />
            {locating && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </div>
        </label>
      )}

      <label className="block">
        <span className="mono-caps text-muted-foreground">Your name (optional)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="So the next person knows who to thank"
          className="mt-2 w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:ring-4 focus:ring-ring/15"
        />
      </label>

      <button
        type="submit"
        disabled={disabled}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-[var(--shadow-lift)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy && <Loader2 className="size-5 animate-spin" />}
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
