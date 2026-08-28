import { Link } from "@tanstack/react-router";

export function IncidentMissing() {
  return (
    <main className="surface-calm flex min-h-screen items-center justify-center px-5">
      <div className="card-elevated max-w-md p-8 text-center">
        <h1 className="text-xl font-bold">Record not found on this device</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Records are stored locally in each browser, so one created on another device won&rsquo;t appear here.
        </p>
        <Link
          to="/"
          className="btn-primary-soft mt-6 inline-flex h-12 items-center justify-center px-6 font-semibold"
        >
          Start a new record
        </Link>
      </div>
    </main>
  );
}
