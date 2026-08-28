import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, MapPin, PenLine, QrCode } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { StepNav } from "@/components/StepNav";
import { IncidentMissing } from "@/components/IncidentMissing";
import { formatTime, loadIncident, timeAgo, type Incident } from "@/lib/incidents";

export const Route = createFileRoute("/incident/$id/")({
  validateSearch: (search: Record<string, unknown>) => ({
    updated: search["updated"] === true || search["updated"] === "true",
  }),
  head: () => ({
    meta: [
      { title: "Live emergency record — Handoff" },
      {
        name: "description",
        content: "Patient state, full timeline of observations and critical changes, ready for the next rescuer.",
      },
      { property: "og:title", content: "Live emergency record — Handoff" },
      { property: "og:description", content: "Read the timeline, then add what you see. Nothing gets lost between rescuers." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ViewIncident,
});

function ViewIncident() {
  const { id } = Route.useParams();
  const { updated } = Route.useSearch();
  const [incident, setIncident] = useState<Incident | null | undefined>(undefined);

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
  if (incident === null) return <IncidentMissing />;

  const state = incident.structured_state;
  const high = state.priority === "high";
  const last = incident.timeline[incident.timeline.length - 1];
  const banner = updated ? last?.ai_analysis?.critical_alert : null;

  return (
    <main className="surface-calm min-h-screen pb-32">
      <div className="mx-auto w-full max-w-[720px] px-5 pt-8">
        <AppHeader badge="Live record" />
        <StepNav current="view" incidentId={id} />

        {banner && (
          <div className="rise-in mt-6 flex items-start gap-3 rounded-2xl border border-critical/25 bg-critical-soft p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-critical" />
            <p className="text-[0.95rem] font-semibold text-critical">NEW: {banner}</p>
          </div>
        )}
        {updated && !banner && (
          <div className="rise-in mt-6 flex items-start gap-3 rounded-2xl border border-calm/25 bg-calm-soft p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-calm" />
            <p className="text-[0.95rem] font-semibold text-calm">Update added. No critical change detected.</p>
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
            <h1 className="text-[1.7rem] font-bold leading-snug tracking-tight text-foreground">{state.summary}</h1>

            <dl className="mt-6 grid grid-cols-2 gap-2.5">
              <Fact label="Consciousness" value={labelize(state.consciousness)} danger={state.consciousness === "unconscious"} />
              <Fact
                label="Breathing"
                value={state.breathing === "yes" ? "Confirmed" : state.breathing === "no" ? "Not breathing" : "Unknown"}
                danger={state.breathing === "no"}
              />
              <Fact
                label="Trauma"
                value={state.trauma_suspected.length ? state.trauma_suspected.join(", ") : "None reported"}
              />
              <Fact label="Location" value={incident.location || "Not recorded"} />
            </dl>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" />
                Reported by {incident.creator_name}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-primary" />
                Started {timeAgo(incident.created_at)}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between px-1">
            <h2 className="mono-caps text-muted-foreground">Timeline · {incident.timeline.length} entries</h2>
            <Link
              to="/incident/$id/share"
              params={{ id }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              <QrCode className="size-4" /> Share
            </Link>
          </div>

          <ol className="mt-4 flex flex-col gap-3">
            {incident.timeline.map((entry, i) => {
              const critical = entry.ai_analysis?.critical_alert;
              return (
                <li key={entry.id} className="relative pl-6">
                  <span className={`absolute left-0 top-5 size-2.5 rounded-full ${critical ? "bg-critical" : "bg-primary"}`} />
                  {i < incident.timeline.length - 1 && (
                    <span className="absolute left-[4.5px] top-8 h-[calc(100%-1rem)] w-px bg-border" />
                  )}
                  <div className={`card-elevated p-4 ${critical ? "border-critical/40 bg-critical-soft" : ""}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-sm font-bold text-foreground">{formatTime(entry.timestamp)}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(entry.timestamp)}</span>
                    </div>
                    <ul className="mt-2.5 flex flex-col gap-1.5">
                      {toPoints(entry.observation).map((p, k) => (
                        <li key={k} className="flex gap-2.5 text-[1.02rem] leading-snug text-foreground">
                          <span className={`mt-[0.5rem] size-1.5 shrink-0 rounded-full ${critical ? "bg-critical" : "bg-primary"}`} />
                          {p}
                        </li>
                      ))}
                    </ul>

                    {critical && (
                      <p className="mt-3 inline-flex items-start gap-2 rounded-lg bg-critical/10 px-3 py-2 text-sm font-semibold text-critical">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        {critical}
                      </p>
                    )}
                    {!!entry.ai_analysis?.changed_fields.length && (
                      <p className="mt-2 text-xs font-medium text-primary">
                        Changed: {entry.ai_analysis.changed_fields.join(", ")}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">Added by {entry.added_by || "Anonymous"}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/85 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[720px]">
          <Link
            to="/incident/$id/update"
            params={{ id }}
            className="btn-primary-soft inline-flex h-[3.75rem] w-full items-center justify-center gap-2 text-[1.1rem] font-semibold hover:brightness-[1.06] active:scale-[0.985]"
          >
            <PenLine className="size-5" /> Add your update
          </Link>
        </div>
      </div>
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
