import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { StepNav } from "@/components/StepNav";
import { IncidentMissing } from "@/components/IncidentMissing";
import { IncidentForm } from "@/components/IncidentForm";
import { analyzeUpdate, formatTime, loadIncident, newId, saveIncident, type Incident } from "@/lib/incidents";

export const Route = createFileRoute("/incident/$id/update")({
  head: () => ({
    meta: [
      { title: "Add an update — Handoff" },
      { name: "description", content: "Add what's changed since the last observation so the next rescuer stays current." },
      { property: "og:title", content: "Add an update — Handoff" },
      { property: "og:description", content: "Say or type what's changed. Critical changes are flagged automatically." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UpdatePage,
});

function UpdatePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null | undefined>(undefined);

  useEffect(() => setIncident(loadIncident(id)), [id]);

  if (incident === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading record…</div>;
  }
  if (incident === null) return <IncidentMissing />;

  const prior = incident.timeline.slice(-3).reverse();

  return (
    <main className="surface-calm min-h-screen">
      <div className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-8">
        <AppHeader badge="Live record" />
        <StepNav current="update" incidentId={id} />

        <Link
          to="/incident/$id"
          params={{ id }}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to timeline
        </Link>

        <section className="mt-4">
          <h2 className="mono-caps px-1 text-muted-foreground">What&rsquo;s already known</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {prior.map((entry) => (
              <div key={entry.id} className="tile-soft px-4 py-3">
                <span className="font-mono text-xs font-bold text-muted-foreground">{formatTime(entry.timestamp)}</span>
                <p className="mt-1 text-[0.98rem] leading-relaxed text-foreground">{entry.observation}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">{entry.added_by || "Anonymous"}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card-elevated rise-in mt-6 p-6 sm:p-8">
          <IncidentForm
            heading="What's changed?"
            hint="Anything new since the last note — breathing, bleeding, alertness, and what you did."
            placeholder="She's now vomiting and can't remember what happened."
            submitLabel="Add update"
            onSubmit={async ({ report, name }) => {
              const current = loadIncident(id);
              if (!current) return;
              const analysis = await analyzeUpdate(current.structured_state, report, current.timeline);
              saveIncident({
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
              });
              navigate({ to: "/incident/$id", params: { id }, search: { updated: true } });
            }}
          />
        </section>
      </div>
    </main>
  );
}
