import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, QrCode, Radio, ShieldCheck } from "lucide-react";
import { IncidentForm } from "@/components/IncidentForm";
import { analyzeInitialReport, listIncidents, newId, saveIncident, timeAgo, type Incident } from "@/lib/incidents";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Handoff — Emergency Information Continuity" },
      {
        name: "description",
        content:
          "First person on scene? Tell us what you see. Handoff turns it into one link the next rescuer can scan, read and update.",
      },
      { property: "og:title", content: "Handoff — Emergency Information Continuity" },
      {
        property: "og:description",
        content: "One link. One scan. Nothing gets lost between the first rescuer and the paramedic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [recent, setRecent] = useState<Incident[]>([]);

  useEffect(() => setRecent(listIncidents().slice(0, 3)), []);

  return (
    <main className="min-h-screen surface-calm">
      <div className="mx-auto w-full max-w-[800px] px-5 pb-24 pt-10 sm:pt-16">
        <header className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Radio className="size-4" />
          </span>
          <span className="text-lg font-bold tracking-tight">Handoff</span>
        </header>

        <h1 className="mt-10 text-4xl font-extrabold leading-[1.05] text-foreground sm:text-5xl">
          First person on scene.
          <br />
          <span className="text-primary">No training required.</span>
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Just tell us what you see. We turn it into a hand-off so perfect, the next rescuer knows everything.
          One link. One scan.
        </p>

        <ul className="mt-8 flex flex-wrap gap-2">
          {[
            { icon: QrCode, label: "Share by QR or link" },
            { icon: ShieldCheck, label: "Critical changes flagged" },
            { icon: Radio, label: "Live timeline" },
          ].map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground"
            >
              <Icon className="size-3.5 text-primary" />
              {label}
            </li>
          ))}
        </ul>

        <section className="card-elevated mt-10 p-6 sm:p-8">
          <IncidentForm
            heading="Create emergency record"
            hint="Three or four sentences is plenty. What happened, and what do you see right now?"
            placeholder="Man fell off his bike on Samora Machel Ave. He's awake but confused, bleeding from his forehead."
            submitLabel="Create emergency record"
            showLocation
            onSubmit={async ({ report, location, name }) => {
              const state = await analyzeInitialReport(report);
              const id = newId();
              const now = new Date().toISOString();
              saveIncident({
                id,
                created_at: now,
                location,
                creator_name: name || "Anonymous",
                initial_report: report,
                structured_state: state,
                timeline: [
                  {
                    id: newId(),
                    timestamp: now,
                    observation: report,
                    added_by: name || "Anonymous",
                    ai_analysis: null,
                    priority_change: state.priority === "high",
                  },
                ],
              });
              navigate({ to: "/incident/$id", params: { id }, search: { created: true } });
            }}
          />
        </section>

        {recent.length > 0 && (
          <section className="mt-10">
            <h2 className="mono-caps text-muted-foreground">Records on this device</h2>
            <div className="mt-3 flex flex-col gap-2">
              {recent.map((inc) => (
                <Link
                  key={inc.id}
                  to="/incident/$id"
                  params={{ id: inc.id }}
                  search={{ created: false }}
                  className="card-elevated flex items-center justify-between gap-4 px-4 py-3 transition hover:border-ring"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{inc.structured_state.summary}</span>
                    <span className="mono-caps text-muted-foreground">{timeAgo(inc.created_at)}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-primary" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
