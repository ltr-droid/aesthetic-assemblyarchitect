import { Link } from "@tanstack/react-router";
import { ClipboardList, QrCode, Activity, PenLine } from "lucide-react";

export type StepKey = "create" | "share" | "view" | "update";

const STEPS: { key: StepKey; label: string; icon: typeof QrCode }[] = [
  { key: "create", label: "Record", icon: ClipboardList },
  { key: "share", label: "Share", icon: QrCode },
  { key: "view", label: "Timeline", icon: Activity },
  { key: "update", label: "Update", icon: PenLine },
];

export function StepNav({ current, incidentId }: { current: StepKey; incidentId?: string }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <nav aria-label="Progress" className="mt-6">
      <ol className="flex items-center gap-1.5 rounded-full border border-border bg-card/70 p-1.5 shadow-[var(--shadow-card)] backdrop-blur">
        {STEPS.map((step, i) => {
          const active = i === currentIndex;
          const done = i < currentIndex;
          const Icon = step.icon;

          const inner = (
            <span
              className={`flex w-full items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[0.78rem] font-semibold transition ${
                active
                  ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-lift)]"
                  : done
                    ? "text-calm"
                    : "text-muted-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className={active ? "" : "hidden sm:inline"}>{step.label}</span>
            </span>
          );

          const target =
            incidentId && step.key === "share"
              ? { to: "/incident/$id/share" as const }
              : incidentId && step.key === "view"
                ? { to: "/incident/$id" as const }
                : incidentId && step.key === "update"
                  ? { to: "/incident/$id/update" as const }
                  : step.key === "create"
                    ? { to: "/" as const }
                    : null;

          return (
            <li key={step.key} className="flex-1">
              {target ? (
                <Link
                  {...(target as any)}
                  params={incidentId ? { id: incidentId } : undefined}
                  className="block"
                  aria-current={active ? "step" : undefined}
                >
                  {inner}
                </Link>
              ) : (
                <span className="block opacity-60">{inner}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
