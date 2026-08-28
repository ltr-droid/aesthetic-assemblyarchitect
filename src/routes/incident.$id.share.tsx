import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ArrowRight, Check, Copy, MessageCircle, MessageSquare, CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { StepNav } from "@/components/StepNav";
import { loadIncident, type Incident } from "@/lib/incidents";

export const Route = createFileRoute("/incident/$id/share")({
  head: () => ({
    meta: [
      { title: "Share this emergency record — Handoff" },
      {
        name: "description",
        content: "Your emergency record is ready. Show the QR code or send the link to the next person on scene.",
      },
      { property: "og:title", content: "Share this emergency record — Handoff" },
      { property: "og:description", content: "One scan hands the full picture to the next rescuer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SharePage,
});

function SharePage() {
  const { id } = Route.useParams();
  const [incident, setIncident] = useState<Incident | null | undefined>(undefined);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setIncident(loadIncident(id));
    const link = `${window.location.origin}/incident/${id}`;
    setUrl(link);
    QRCode.toDataURL(link, { width: 900, margin: 1, color: { dark: "#0b1b34", light: "#ffffff" } }).then(setQr);
  }, [id]);

  const smsHref = `sms:?&body=${encodeURIComponent(`Emergency record — please read and add what you see: ${url}`)}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(`Emergency record — please read and add what you see: ${url}`)}`;

  return (
    <main className="surface-calm min-h-screen">
      <div className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-8">
        <AppHeader badge="Record saved" />
        <StepNav current="share" incidentId={id} />

        <section className="rise-in mt-10 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-calm-soft">
            <CheckCircle2 className="size-8 text-calm" />
          </div>
          <h1 className="mt-5 text-[2.1rem] font-extrabold leading-tight tracking-tight sm:text-[2.5rem]">
            Your emergency record is ready
          </h1>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-muted-foreground">
            Share this with the next person on scene.
          </p>
        </section>

        <section className="card-elevated rise-in mt-8 p-6 text-center sm:p-8">
          {qr ? (
            <img
              src={qr}
              alt="QR code linking to this emergency record"
              className="mx-auto aspect-square w-full max-w-[340px] rounded-3xl border border-border bg-card p-4"
            />
          ) : (
            <div className="mx-auto aspect-square w-full max-w-[340px] animate-pulse rounded-3xl bg-secondary" />
          )}

          <p className="mt-6 break-all rounded-2xl bg-secondary px-4 py-3 font-mono text-[0.85rem] text-muted-foreground">
            {url}
          </p>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[0.95rem] font-semibold transition hover:border-ring active:scale-[0.98]"
            >
              {copied ? <Check className="size-4 text-calm" /> : <Copy className="size-4 text-primary" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <a
              href={smsHref}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[0.95rem] font-semibold transition hover:border-ring active:scale-[0.98]"
            >
              <MessageSquare className="size-4 text-primary" /> Share via SMS
            </a>
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[0.95rem] font-semibold transition hover:border-ring active:scale-[0.98]"
            >
              <MessageCircle className="size-4 text-primary" /> WhatsApp
            </a>
          </div>
        </section>

        {incident && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Reported by {incident.creator_name} · {incident.location || "location not recorded"}
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/85 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[720px]">
          <Link
            to="/incident/$id"
            params={{ id }}
            search={{ updated: false }}
            className="btn-primary-soft inline-flex h-[3.75rem] w-full items-center justify-center gap-2 text-[1.05rem] font-semibold hover:brightness-[1.06] active:scale-[0.985]"
          >
            Open the live record <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
