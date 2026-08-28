import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MapPin,
  MessageCircle,
  Radio,
  Share2,
  X,
} from "lucide-react";
import { IncidentForm } from "@/components/IncidentForm";
import {
  analyzeUpdate,
  formatTime,
  loadIncident,
  newId,
  saveIncident,
  timeAgo,
  type Incident,
} from "@/lib/incidents";

export const Route = createFileRoute("/incident/$id")({
  validateSearch: (search: Record<string, unknown>) => ({ created: search["created"] === true || search["created"] === "true" }),
  head: () => ({
    meta: [
      { title: "Emergency record — Handoff" },
      { name: "description", content: "Live emergency record: patient state, timeline of observations and critical changes." },
      { property: "og:title", content: "Emergency record — Handoff" },
      { property: "og:description", content: "Scan, read the timeline, add what you see. Nothing gets lost between rescuers." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IncidentPage,
});

function IncidentPage() {
  const { id } = Route.useParams();
  const { created } = Route.useSearch();
  const [incident, setIncident] = useState<Incident | null | undefined>(undefined);
  const [showShare, setShowShare] = useState(created);
  const [showForm, setShowForm] = useState(false);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);

  const refresh = useCallback(() => setIncident(loadIncident(id)), [id]);

  useEffect(() => {
    refresh();
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    const t = setInterval(refresh, 4000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, [refresh]);

  if (incident === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading record…</div>;
  }

  if (incident === null) {
    return (
      <main className="surface-calm flex min-h-screen items-center justify-center px-5">
        <div className="card-elevated max-w-md p-8 text-center">
          <h1 className="text-xl font-bold">Record not found on this device</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This demo stores records locally in each browser, so a record created elsewhere won't appear here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
          >
            Create a new record
          </Link>
        </div>
      </main>
    );
  }

  const state = incident.structured_state;
  const high = state.priority === "high";

  return (
    <main className="surface-calm min-h-screen pb-32">
      <div className="mx-auto w-full max-w-[720px] px-5 pt-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-lift)]">
              <Radio className="size-4" />
            </span>
            <span className="text-lg font-bold tracking-tight">Handoff</span>
          </Link>
          <button
            onClick={() => setShowShare(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold shadow-[var(--shadow-card)] transition hover:border-ring"
          >
            <Share2 className="size-4 text-primary" /> Hand off
          </button>
        </header>

        {alertBanner && (
          <div className="rise-in mt-6 flex items-start gap-3 rounded-2xl border border-critical/25 bg-critical-soft p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-critical" />
            <p className="text-sm font-semibold text-critical">NEW: {alertBanner}</p>
          </div>
        )}

        <section className={`card-elevated rise-in mt-6 overflow-hidden ${high ? "border-critical/30" : ""}`}>
          <div
            className={`flex items-center gap-2 px-6 py-3 ${high ? "bg-critical text-critical-foreground" : "bg-calm-soft text-calm"}`}
          >
            {high ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
            <span className="mono-caps">{high ? "High priority" : "Stable — monitor"}</span>
          </div>

          <div className="p-6 sm:p-7">
            <h1 className="text-[1.6rem] font-bold leading-snug tracking-tight text-foreground">{state.summary}</h1>

            <dl className="mt-6 grid grid-cols-2 gap-2.5">
              <Fact label="Consciousness" value={labelize(state.consciousness)} />
              <Fact label="Breathing" value={state.breathing === "yes" ? "Confirmed" : state.breathing === "no" ? "Not breathing" : "Unknown"} danger={state.breathing === "no"} />
              <Fact
                label="Injuries noted"
                value={state.trauma_suspected.length ? state.trauma_suspected.join(", ") : "None reported"}
              />
              <Fact label="Reported by" value={incident.creator_name} />
            </dl>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" />
                {incident.location || "Location not recorded"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-primary" />
                Started {timeAgo(incident.created_at)}
              </span>
            </div>
          </div>
        </section>


        <section className="mt-10">
          <h2 className="mono-caps text-muted-foreground">Timeline · {incident.timeline.length} entries</h2>
          <ol className="mt-4 flex flex-col gap-3">
            {incident.timeline.map((entry, i) => {
              const critical = entry.ai_analysis?.critical_alert;
              return (
                <li key={entry.id} className="relative pl-6">
                  <span className="absolute left-0 top-5 size-2.5 rounded-full bg-primary" />
                  {i < incident.timeline.length - 1 && (
                    <span className="absolute left-[4.5px] top-8 h-[calc(100%-1rem)] w-px bg-border" />
                  )}
                  <div className={`card-elevated p-4 ${critical ? "border-critical/40 bg-critical-soft" : ""}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-sm font-bold text-foreground">{formatTime(entry.timestamp)}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(entry.timestamp)}</span>
                    </div>
                    <p className="mt-2 text-base leading-relaxed text-foreground">{entry.observation}</p>
                    {critical && (
                      <p className="mt-3 inline-flex items-start gap-2 rounded-lg bg-critical/10 px-3 py-2 text-sm font-semibold text-critical">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        {critical}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">Added by {entry.added_by || "Anonymous"}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {showForm && (
          <section className="card-elevated mt-8 p-6">
            <IncidentForm
              heading="What's changed?"
              hint="Anything new since the last note — breathing, bleeding, alertness, what you did."
              placeholder="She's now vomiting and can't remember what happened."
              submitLabel="Add update"
              onSubmit={async ({ report, name }) => {
                const current = loadIncident(incident.id);
                if (!current) return;
                const analysis = await analyzeUpdate(current.structured_state, report, current.timeline);
                const updated: Incident = {
                  ...current,
                  structured_state: analysis.updated_state,
                  timeline: [
                    ...current.timeline,
                    {
                      id: newId(),
                      timestamp: new Date().toISOString(),
                      observation: report,
                      added_by: name || "Anonymous",
                      ai_analysis: analysis,
                      priority_change: analysis.priority_escalated,
                    },
                  ],
                };
                saveIncident(updated);
                setIncident(updated);
                setAlertBanner(analysis.critical_alert);
                setShowForm(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/85 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[720px] gap-3">
          <button
            onClick={() => setShowForm((v) => !v)}
            className={`inline-flex h-[3.5rem] flex-1 items-center justify-center text-[1.05rem] font-semibold transition active:scale-[0.985] ${
              showForm
                ? "rounded-2xl border border-border bg-secondary text-foreground"
                : "btn-primary-soft hover:brightness-[1.06]"
            }`}
          >
            {showForm ? "Cancel" : "Add update"}
          </button>
        </div>
      </div>

      {showShare && <SharePanel incident={incident} onClose={() => setShowShare(false)} />}
    </main>
  );
}

function labelize(v: string) {
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function Fact({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`rounded-2xl p-3.5 ${danger ? "bg-critical-soft" : "tile-soft"}`}>
      <dt className="mono-caps text-muted-foreground">{label}</dt>
      <dd className={`mt-1.5 text-[0.95rem] font-semibold leading-snug ${danger ? "text-critical" : "text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}


function SharePanel({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  const [qr, setQr] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/incident/${incident.id}` : "";

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 640, margin: 1, color: { dark: "#0b1b34", light: "#ffffff" } }).then(setQr);
  }, [url]);

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Emergency record", text: "Live emergency record — please read and add what you see.", url });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`Emergency record: ${url}`)}`, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-md rounded-t-3xl bg-card p-6 text-center shadow-[var(--shadow-lift)] sm:rounded-3xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="ml-auto flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="mx-auto -mt-2 flex size-12 items-center justify-center rounded-full bg-calm-soft">
          <CheckCircle2 className="size-6 text-calm" />
        </div>
        <h2 className="mt-3 text-2xl font-bold">Ready to share</h2>
        <p className="mt-1 text-sm text-muted-foreground">Show this to the next person on scene.</p>

        {qr && (
          <img
            src={qr}
            alt="QR code linking to this emergency record"
            className="mx-auto mt-5 size-56 rounded-2xl border border-border p-2"
          />
        )}

        <p className="mt-4 break-all rounded-xl bg-secondary px-3 py-2 font-mono text-xs text-muted-foreground">{url}</p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card font-semibold transition hover:border-ring"
          >
            {copied ? <Check className="size-4 text-calm" /> : <Copy className="size-4 text-primary" />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            onClick={share}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition hover:brightness-110"
          >
            <MessageCircle className="size-4" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
