// Canonical data contract shared by the backend checker (scripts/check.ts) and
// the Vue front-end. These types describe both the input config (sites.json)
// and the generated data the UI reads (summary.json + per-site history).
//
// Imported as `import type ...` from both sides, so it is erased at runtime and
// never needs to be bundled or installed as a dependency.

export type SiteType = "minecraft" | "http";

export type Status = "up" | "degraded" | "down";

/** A single monitored target as declared in config/sites.json. */
export interface SiteConfig {
  slug: string;
  name: string;
  type: SiteType;
  /** Minecraft only. */
  host?: string;
  /** Minecraft only. */
  port?: number;
  /** HTTP only. */
  url?: string;
  /** Optional icon URL. May 404; the UI degrades gracefully. */
  icon?: string;
}

export interface Settings {
  retentionDays: number;
  degradedThresholdMs: number;
  timeoutMs: number;
}

export interface Intro {
  title: string;
  message: string;
}

export interface Config {
  name: string;
  cname?: string;
  logoUrl?: string;
  favicon?: string;
  github?: string;
  intro?: Intro;
  settings?: Partial<Settings>;
  sites: SiteConfig[];
}

/** Player counts returned by a Minecraft Server List Ping. */
export interface Players {
  online: number | null;
  max: number | null;
}

/** One recorded measurement, stored compactly in per-site history files. */
export interface HistoryPoint {
  /** Unix time, seconds. */
  t: number;
  /** Status at check time. */
  s: Status;
  /** Response time in ms, or null when down. */
  r: number | null;
  /** Players online (Minecraft only). */
  p?: number | null;
}

export interface SiteHistory {
  slug: string;
  name?: string;
  points: HistoryPoint[];
}

/** Aggregates over standard windows; null when no data in the window. */
export interface Windowed<T> {
  "24h": T;
  "7d": T;
  "30d": T;
  all: T;
}

/** One day's uptime fraction for the rolling history bar chart. */
export interface DayBar {
  /** ISO date, YYYY-MM-DD (UTC). */
  date: string;
  uptime: number | null;
}

/** A fully-aggregated site, as emitted into summary.json for the UI. */
export interface SiteSummary {
  slug: string;
  name: string;
  type: SiteType;
  icon: string | null;
  /** Human-readable target (host:port or url). */
  target: string;
  url: string | null;
  status: Status;
  responseTime: number | null;
  players: Players | null;
  version: string | null;
  /** ISO timestamp of the most recent check. */
  lastChecked: string;
  error: string | null;
  uptime: Windowed<number | null>;
  avgResponseTime: Windowed<number | null>;
  /** Recent response times for the sparkline (null = down). */
  sparkline: (number | null)[];
  /** Per-day uptime for the last 30 days (oldest -> newest). */
  bars: DayBar[];
}

/** The single document the front-end fetches: frontend/public/data/summary.json. */
export interface Summary {
  name: string;
  intro: Intro | null;
  logoUrl: string | null;
  github: string | null;
  /** ISO timestamp of this generation. */
  generatedAt: string;
  sites: SiteSummary[];
}

/** Result of a single probe, before aggregation. */
export type CheckResult = {
  up: boolean;
  responseTime: number | null;
  players?: Players | null;
  version?: string | null;
  favicon?: string | null;
  code?: number;
  error?: string;
};
