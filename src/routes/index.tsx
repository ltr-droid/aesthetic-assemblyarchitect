import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, QrCode, Activity, ShieldCheck } from "lucide-react";
import { IncidentForm } from "@/components/IncidentForm";
import { AppHeader } from "@/components/AppHeader";
import { StepNav } from "@/components/StepNav";
import { analyzeInitialReport, listIncidents, newId, saveIncident, timeAgo, type Incident } from "@/lib/incidents";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Handoff — Create an Emergency Record" },
      {
        name: "description",
        content:
          "First person on scene? Say or type what you see. Handoff turns it into one link the next rescuer can scan, read and update.",
      },
      { property: "og:title", content: "Handoff — Create an Emergency Record" },
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
    <main className="surface-calm min-h-screen">
      <div className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-8">
        <AppHeader />
        <StepNav current="create" />

        <section className="rise-in mt-10 text-center">
          <h1 className="text-[2.8rem] font-extrabold leading-[1.03] tracking-tight text-foreground sm:text-[3.4rem]">
            What do you
            <br />
            <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">see?</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[1.05rem] leading-relaxed text-muted-foreground">
            Say it in your own words. We turn it into one calm, clear record the next rescuer can scan
            and continue.
          </p>
        </section>

        <ul className="mt-8 grid grid-cols-3 gap-2.5">
          {[
            { icon: QrCode, label: "Share by QR" },
            { icon: ShieldCheck, label: "Changes flagged" },
            { icon: Activity, label: "Live timeline" },
          ].map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="tile-soft flex flex-col items-center gap-2 px-2 py-4 text-center text-[0.8rem] font-medium text-muted-foreground"
            >
              <Icon className="size-4 text-primary" />
              {label}
            </li>
          ))}
        </ul>

        <section className="card-elevated rise-in mt-6 p-6 sm:p-8">
          <IncidentForm
            heading="Describe the emergency"
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
              navigate({ to: "/incident/$id/share", params: { id } });
            }}
          />
        </section>

        {recent.length > 0 && (
          <section className="mt-10">
            <h2 className="mono-caps px-1 text-muted-foreground">Records on this device</h2>
            <div className="card-elevated mt-3 divide-y divide-border overflow-hidden">
              {recent.map((inc) => (
                <Link
                  key={inc.id}
                  to="/incident/$id"
                  params={{ id: inc.id }}
                  className="flex items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-secondary"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{inc.structured_state.summary}</span>
                    <span className="mono-caps text-muted-foreground">{timeAgo(inc.created_at)}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
