#!/usr/bin/env -S npx tsx
// TORO Status — custom uptime checker (TypeScript, zero runtime dependencies).
//
// Runs every cron tick: performs a Minecraft Server List Ping (SLP) for
// `minecraft` sites and an HTTP request for `http` sites, appends the result to
// each site's rolling history, recomputes uptime / response-time aggregates, and
// writes the data the Vue front-end reads from `frontend/public/data/`.
//
// Usage: npm run check   (or: npx tsx scripts/check.ts)

import net from "node:net";
import dns from "node:dns/promises";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

import type {
  Config,
  CheckResult,
  DayBar,
  HistoryPoint,
  Players,
  SiteConfig,
  SiteHistory,
  SiteSummary,
  Status,
  Summary,
} from "../shared/types.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = path.join(ROOT, "config", "sites.json");
const DATA_DIR = path.join(ROOT, "frontend", "public", "data");
const HISTORY_DIR = path.join(DATA_DIR, "history");

const DAY = 86400; // seconds

// ---------------------------------------------------------------------------
// Minecraft Server List Ping (status) — gives up/down, latency, and players
// ---------------------------------------------------------------------------

function writeVarInt(value: number): Buffer {
  const bytes: number[] = [];
  let v = value;
  do {
    let temp = v & 0x7f;
    v >>>= 7;
    if (v !== 0) temp |= 0x80;
    bytes.push(temp);
  } while (v !== 0);
  return Buffer.from(bytes);
}

function readVarInt(
  buf: Buffer,
  offset: number
): { value: number; size: number } | null {
  let numRead = 0;
  let result = 0;
  let byte = 0;
  do {
    if (offset + numRead >= buf.length) return null; // need more bytes
    byte = buf[offset + numRead]!;
    result |= (byte & 0x7f) << (7 * numRead);
    numRead++;
    if (numRead > 5) throw new Error("VarInt too big");
  } while ((byte & 0x80) !== 0);
  return { value: result >>> 0, size: numRead };
}

function buildHandshake(host: string, port: number): Buffer {
  const hostBuf = Buffer.from(host, "utf8");
  const payload = Buffer.concat([
    Buffer.from([0x00]), // packet id: handshake
    writeVarInt(47), // protocol version (any; server reports its own)
    writeVarInt(hostBuf.length),
    hostBuf,
    Buffer.from([(port >> 8) & 0xff, port & 0xff]), // unsigned short, big-endian
    writeVarInt(1), // next state: status
  ]);
  return Buffer.concat([writeVarInt(payload.length), payload]);
}

const STATUS_REQUEST = Buffer.concat([writeVarInt(1), Buffer.from([0x00])]);

interface ParsedStatus {
  players: Players | null;
  version: string | null;
  favicon: string | null;
}

function parseStatusResponse(buf: Buffer): ParsedStatus | null {
  const lenField = readVarInt(buf, 0);
  if (!lenField) return null;
  const totalNeeded = lenField.size + lenField.value;
  if (buf.length < totalNeeded) return null; // wait for the full packet

  let off = lenField.size;
  const pid = readVarInt(buf, off);
  if (!pid) return null;
  off += pid.size;

  const strLen = readVarInt(buf, off);
  if (!strLen) return null;
  off += strLen.size;

  const jsonBytes = buf.subarray(off, off + strLen.value);
  if (jsonBytes.length < strLen.value) return null;

  try {
    const json = JSON.parse(jsonBytes.toString("utf8")) as {
      players?: { online?: number; max?: number };
      version?: { name?: string };
      favicon?: string;
    };
    return {
      players: json.players
        ? { online: json.players.online ?? null, max: json.players.max ?? null }
        : null,
      version: json.version?.name ?? null,
      favicon: json.favicon ?? null,
    };
  } catch {
    return { players: null, version: null, favicon: null }; // responded, but odd payload — still up
  }
}

const MINECRAFT_DEFAULT_PORT = 25565;

async function resolveSrv(
  host: string,
  port: number
): Promise<{ host: string; port: number; srvUsed: boolean }> {
  try {
    const records = await dns.resolveSrv(`_minecraft._tcp.${host}`);
    if (records.length > 0) {
      // Sort by priority (ascending), then weight (descending) per RFC 2782.
      records.sort((a, b) => a.priority - b.priority || b.weight - a.weight);
      const srv = records[0]!;
      return { host: srv.name, port: srv.port, srvUsed: true };
    }
  } catch {
    // No SRV record — fall through to direct connection.
  }
  return { host, port, srvUsed: false };
}

async function minecraftPing(
  host: string,
  port: number,
  timeoutMs: number
): Promise<CheckResult & { srvUsed: boolean }> {
  // Resolve SRV record first; handshake still uses the original host for virtual hosting.
  const { host: connectHost, port: connectPort, srvUsed } = await resolveSrv(host, port);

  return new Promise<CheckResult>((resolve) => {
    const start = performance.now();
    let settled = false;
    let connected = false;
    let chunks = Buffer.alloc(0);

    const socket = net.createConnection({ host: connectHost, port: connectPort });
    socket.setTimeout(timeoutMs);

    const finish = (result: CheckResult): void => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.on("connect", () => {
      connected = true;
      socket.write(Buffer.concat([buildHandshake(host, port), STATUS_REQUEST]));
    });

    socket.on("data", (d: Buffer) => {
      chunks = Buffer.concat([chunks, d]);
      try {
        const parsed = parseStatusResponse(chunks);
        if (parsed) {
          finish({
            up: true,
            responseTime: Math.round(performance.now() - start),
            players: parsed.players,
            version: parsed.version,
            favicon: parsed.favicon,
          });
        }
      } catch (e) {
        // Connected and received data, but failed to parse: treat as up (TCP reachable).
        finish({
          up: true,
          responseTime: Math.round(performance.now() - start),
          players: null,
          version: null,
          error: String(e instanceof Error ? e.message : e),
        });
      }
    });

    socket.on("timeout", () =>
      finish({
        up: connected,
        responseTime: connected ? Math.round(performance.now() - start) : null,
        error: "timeout",
      })
    );
    socket.on("error", (e: NodeJS.ErrnoException) =>
      finish({
        up: connected,
        responseTime: connected ? Math.round(performance.now() - start) : null,
        error: e.code || e.message,
      })
    );
    socket.on("close", () => {
      // Connected but closed before a parseable status: treat as up (TCP reachable).
      if (connected) {
        finish({
          up: true,
          responseTime: Math.round(performance.now() - start),
          players: null,
          version: null,
        });
      } else {
        finish({ up: false, responseTime: null, error: "closed" });
      }
    });
  }).then((result) => ({ ...result, srvUsed }));
}

// ---------------------------------------------------------------------------
// HTTP check
// ---------------------------------------------------------------------------

async function httpCheck(url: string, timeoutMs: number): Promise<CheckResult> {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "User-Agent": "TORO-Status/2.0 (+https://status.torosaba.net)",
      },
    });
    // Drain the body so the connection can close cleanly.
    await res.arrayBuffer().catch(() => {});
    const responseTime = Math.round(performance.now() - start);
    return {
      up: res.status < 500,
      responseTime,
      code: res.status,
    };
  } catch (e) {
    const err = e as { name?: string; cause?: { code?: string }; message?: string };
    return {
      up: false,
      responseTime: null,
      error:
        err.name === "TimeoutError"
          ? "timeout"
          : err.cause?.code || err.message || "error",
    };
  }
}

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

function uptimeOf(points: HistoryPoint[], sinceSec: number | null): number | null {
  const within = sinceSec ? points.filter((p) => p.t >= sinceSec) : points;
  if (within.length === 0) return null;
  const available = within.filter((p) => p.s !== "down").length;
  return Math.round((available / within.length) * 10000) / 100; // 2 decimals
}

function avgRtOf(points: HistoryPoint[], sinceSec: number | null): number | null {
  const within = (sinceSec ? points.filter((p) => p.t >= sinceSec) : points).filter(
    (p): p is HistoryPoint & { r: number } => typeof p.r === "number"
  );
  if (within.length === 0) return null;
  return Math.round(within.reduce((s, p) => s + p.r, 0) / within.length);
}

function dailyBars(points: HistoryPoint[], days: number, nowSec: number): DayBar[] {
  // Per-JST-day uptime fraction for the last `days` days (oldest -> newest).
  const bars: DayBar[] = [];
  const JST_OFFSET = 9 * 3600; // 9 hours in seconds
  const todayStart = Math.floor((nowSec + JST_OFFSET) / DAY) * DAY - JST_OFFSET;
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = todayStart - i * DAY;
    const dayEnd = dayStart + DAY;
    const inDay = points.filter((p) => p.t >= dayStart && p.t < dayEnd);
    bars.push({
      date: new Date((dayStart + JST_OFFSET) * 1000).toISOString().slice(0, 10),
      uptime: inDay.length
        ? Math.round(
            (inDay.filter((p) => p.s !== "down").length / inDay.length) * 10000
          ) / 100
        : null,
    });
  }
  return bars;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function checkSite(
  site: SiteConfig,
  opts: { timeoutMs: number; degradedMs: number; nowSec: number; cutoff: number }
): Promise<SiteSummary> {
  const { timeoutMs, degradedMs, nowSec, cutoff } = opts;

  // ネットワークチェックと履歴ファイル読み込みを並列実行して待ち時間を削減。
  const historyFile = path.join(HISTORY_DIR, `${site.slug}.json`);
  const [check, prev] = await Promise.all([
    site.type === "minecraft"
      ? minecraftPing(site.host ?? "", site.port ?? 0, timeoutMs)
      : httpCheck(site.url ?? "", timeoutMs),
    readJson<SiteHistory>(historyFile, { slug: site.slug, points: [] }),
  ]);

  let status: Status = "down";
  if (check.up) {
    status =
      typeof check.responseTime === "number" && check.responseTime > degradedMs
        ? "degraded"
        : "up";
  }

  const point: HistoryPoint = {
    t: nowSec,
    s: status,
    r: check.responseTime ?? null,
  };
  if (site.type === "minecraft" && check.players) {
    point.p = check.players.online;
  }
  const points = (prev.points || []).filter((p) => p.t >= cutoff);
  points.push(point);

  await fs.writeFile(
    historyFile,
    JSON.stringify({ slug: site.slug, name: site.name, points }),
    "utf8"
  );

  const mcHost = site.host ?? "";
  const mcPort = site.port ?? MINECRAFT_DEFAULT_PORT;
  const srvUsed = site.type === "minecraft" && "srvUsed" in check && check.srvUsed;
  const showPort = !srvUsed && mcPort !== MINECRAFT_DEFAULT_PORT;
  const target =
    site.type === "minecraft"
      ? showPort ? `${mcHost}:${mcPort}` : mcHost
      : site.url ?? "";

  return {
    slug: site.slug,
    name: site.name,
    type: site.type,
    icon: check.favicon ?? site.icon ?? null,
    target,
    url: site.url ?? null,
    status,
    responseTime: check.responseTime ?? null,
    players: site.type === "minecraft" ? check.players ?? null : null,
    version: check.version ?? null,
    lastChecked: new Date(nowSec * 1000).toISOString(),
    error: check.up ? null : check.error ?? null,
    uptime: {
      "24h": uptimeOf(points, nowSec - DAY),
      "7d": uptimeOf(points, nowSec - 7 * DAY),
      "30d": uptimeOf(points, nowSec - 30 * DAY),
      all: uptimeOf(points, null),
    },
    avgResponseTime: {
      "24h": avgRtOf(points, nowSec - DAY),
      "7d": avgRtOf(points, nowSec - 7 * DAY),
      "30d": avgRtOf(points, nowSec - 30 * DAY),
      all: avgRtOf(points, null),
    },
    // Embedded views so the front-end only needs summary.json.
    sparkline: points.slice(-48).map((p) => (p.s === "down" ? null : p.r)),
    bars: dailyBars(points, 30, nowSec),
  };
}

async function main(): Promise<void> {
  const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8")) as Config;
  const settings = config.settings ?? {};
  const timeoutMs = settings.timeoutMs ?? 10000;
  const retentionDays = settings.retentionDays ?? 30;
  const degradedMs = settings.degradedThresholdMs ?? 3000;

  await fs.mkdir(HISTORY_DIR, { recursive: true });

  const nowSec = Math.floor(Date.now() / 1000);
  const cutoff = nowSec - retentionDays * DAY;

  const summarySites = await Promise.all(
    config.sites.map((site) =>
      checkSite(site, { timeoutMs, degradedMs, nowSec, cutoff })
    )
  );

  const summary: Summary = {
    name: config.name,
    intro: config.intro ?? null,
    logoUrl: config.logoUrl ?? null,
    github: config.github ?? null,
    generatedAt: new Date(nowSec * 1000).toISOString(),
    sites: summarySites,
  };

  await fs.writeFile(
    path.join(DATA_DIR, "summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );

  // Console report for CI logs.
  for (const s of summarySites) {
    const extra =
      s.type === "minecraft" && s.players
        ? ` players=${s.players.online}/${s.players.max}`
        : "";
    const dot = s.status === "up" ? "🟩" : s.status === "degraded" ? "🟨" : "🟥";
    console.log(
      `${dot} ${s.name} — ${s.status} ${
        s.responseTime != null ? s.responseTime + "ms" : "-"
      }${extra}${s.error ? ` (${s.error})` : ""}`
    );
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
