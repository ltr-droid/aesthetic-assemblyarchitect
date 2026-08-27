/**
 * Incident storage + analysis layer.
 *
 * Data is stored in localStorage under keys of the form `incident_<uuid>`:
 * {
 *   id, created_at, location, creator_name, initial_report,
 *   structured_state: { consciousness, breathing, trauma_suspected[], priority, summary },
 *   timeline: [{ id, timestamp, observation, added_by, ai_analysis, priority_change }]
 * }
 */

export type Priority = "high" | "normal";

export interface StructuredState {
  consciousness: "unknown" | "conscious" | "unconscious";
  breathing: "yes" | "no" | "unknown";
  trauma_suspected: string[];
  priority: Priority;
  summary: string;
}

export interface UpdateAnalysis {
  changed_fields: string[];
  priority_escalated: boolean;
  critical_alert: string | null;
  updated_state: StructuredState;
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  observation: string;
  added_by: string;
  ai_analysis: UpdateAnalysis | null;
  priority_change: boolean;
}

export interface Incident {
  id: string;
  created_at: string;
  location: string;
  creator_name: string;
  initial_report: string;
  structured_state: StructuredState;
  timeline: TimelineEntry[];
}

const PREFIX = "incident_";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadIncident(id: string): Incident | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PREFIX + id);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Incident;
  } catch {
    return null;
  }
}

export function saveIncident(incident: Incident) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFIX + incident.id, JSON.stringify(incident));
}

export function listIncidents(): Incident[] {
  if (typeof window === "undefined") return [];
  const out: Incident[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      out.push(JSON.parse(window.localStorage.getItem(key)!) as Incident);
    } catch {
      /* ignore malformed entries */
    }
  }
  return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/* ---------------------------------------------------------------------------
 * [API INTEGRATION POINT] — Point A: on initial record creation
 *
 * Replace the local heuristic below with a call to Gemini/ChatGPT:
 *   Prompt: "Summarize this emergency report into structured fields"
 *   Input:  the rescuer's free-text report
 *   Output: { consciousness, breathing, trauma_suspected[], priority, summary }
 * The API key must come from an environment variable / server function —
 * never hardcode it in client code.
 * ------------------------------------------------------------------------- */
export async function analyzeInitialReport(report: string): Promise<StructuredState> {
  const t = report.toLowerCase();
  const consciousness: StructuredState["consciousness"] = /unconscious|not responding|passed out|unresponsive/.test(t)
    ? "unconscious"
    : /awake|talking|conscious|responsive|alert/.test(t)
      ? "conscious"
      : "unknown";
  const breathing: StructuredState["breathing"] = /not breathing|no breath|stopped breathing/.test(t)
    ? "no"
    : /breathing|gasping|panting/.test(t)
      ? "yes"
      : "unknown";

  const trauma: string[] = [];
  const patterns: [RegExp, string][] = [
    [/head|skull|forehead|scalp/, "Head injury"],
    [/bleed|blood/, "Bleeding"],
    [/leg|ankle|knee|femur/, "Leg injury"],
    [/arm|wrist|shoulder|elbow/, "Arm injury"],
    [/back|spine|neck/, "Back or neck injury"],
    [/burn/, "Burns"],
    [/chest|rib/, "Chest injury"],
    [/car|bike|fall|fell|crash|hit/, "Impact or fall"],
  ];
  for (const [re, label] of patterns) if (re.test(t)) trauma.push(label);

  const priority: Priority =
    consciousness === "unconscious" || breathing === "no" || /heavy bleeding|severe|not breathing/.test(t)
      ? "high"
      : "normal";

  const summary = report.trim().split(/(?<=[.!?])\s+/)[0]?.slice(0, 120) || "Emergency reported";

  return { consciousness, breathing, trauma_suspected: trauma, priority, summary };
}

/* ---------------------------------------------------------------------------
 * [API INTEGRATION POINT] — Point B: on each update
 *
 * Replace the local heuristic below with a call to Gemini/ChatGPT:
 *   Prompt: "Given prior state + new observation, what changed? Is this critical?"
 *   Input:  { prior_state, new_observation, timeline }
 *   Output: { changed_fields[], priority_escalated, critical_alert, updated_state }
 * ------------------------------------------------------------------------- */
export async function analyzeUpdate(
  prior: StructuredState,
  observation: string,
  _timeline: TimelineEntry[],
): Promise<UpdateAnalysis> {
  const derived = await analyzeInitialReport(observation);
  const next: StructuredState = {
    consciousness: derived.consciousness !== "unknown" ? derived.consciousness : prior.consciousness,
    breathing: derived.breathing !== "unknown" ? derived.breathing : prior.breathing,
    trauma_suspected: Array.from(new Set([...prior.trauma_suspected, ...derived.trauma_suspected])),
    priority: prior.priority,
    summary: derived.summary,
  };

  const changed: string[] = [];
  if (next.consciousness !== prior.consciousness) changed.push("consciousness");
  if (next.breathing !== prior.breathing) changed.push("breathing");
  if (next.trauma_suspected.length !== prior.trauma_suspected.length) changed.push("injuries");

  const t = observation.toLowerCase();
  const redFlags: [RegExp, string][] = [
    [/vomit/, "Vomiting"],
    [/seizure|fitting|convulsi/, "Seizure"],
    [/weak pulse|no pulse|pulse is weak/, "Weak or absent pulse"],
    [/not breathing|stopped breathing/, "Breathing stopped"],
    [/unconscious|unresponsive|passed out/, "Loss of consciousness"],
    [/heavy bleeding|bleeding a lot|blood everywhere/, "Heavy bleeding"],
    [/confused|slurred|can't remember/, "Confusion"],
  ];
  const flags = redFlags.filter(([re]) => re.test(t)).map(([, label]) => label);

  const headTrauma = next.trauma_suspected.includes("Head injury");
  let alert: string | null = null;
  if (flags.length) {
    alert =
      flags.includes("Vomiting") && headTrauma
        ? "Vomiting after head trauma — possible brain injury"
        : flags.join(" · ");
  }

  const escalated = prior.priority === "normal" && (flags.length > 0 || next.breathing === "no" || next.consciousness === "unconscious");
  if (escalated) next.priority = "high";

  return {
    changed_fields: changed,
    priority_escalated: escalated,
    critical_alert: alert,
    updated_state: next,
  };
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} d ago`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
