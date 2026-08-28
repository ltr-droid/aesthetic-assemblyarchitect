import { Link } from "@tanstack/react-router";
import { Radio, ShieldCheck } from "lucide-react";

export function AppHeader({ badge = "Stays on your device" }: { badge?: string }) {
  return (
    <header className="flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-lift)]">
          <Radio className="size-4" />
        </span>
        <span className="text-lg font-bold tracking-tight">Handoff</span>
      </Link>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-calm-soft px-3 py-1.5 text-xs font-semibold text-calm">
        <ShieldCheck className="size-3.5" /> {badge}
      </span>
    </header>
  );
}
