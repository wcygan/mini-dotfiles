// Dual-output logger: pretty stdout + JSONL file
// Env:
// - LOG_FORMAT=pretty|json|both (default: both)
// - LOG_FILE=path (default: ./.logs/install.jsonl)
// - NO_COLOR=1 to disable colors (or when not a TTY)
// - LOG_EMOJI=0 to disable emojis

type Level = "DEBUG" | "INFO" | "WARN" | "ERROR" | "SUCCESS";
type Event = "step_begin" | "step_end" | "log";

interface BaseFields {
  ts: string;
  lvl: Level;
  ev: Event;
  step?: string;
  msg?: string;
  ok?: boolean;
  code?: number;
  duration_ms?: number;
  component?: string;
  version: number;
  error?: string;
}

const VERSION = 1;

function env(name: string): string | undefined {
  try {
    return Deno.env.get(name);
  } catch {
    return undefined;
  }
}

function envBool(name: string, def = false): boolean {
  const v = env(name);
  if (v == null) return def;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

function envStr(name: string, def: string): string {
  const v = env(name);
  return v == null || v === "" ? def : v;
}

function isTTY(): boolean {
  try {
    // Deno.isatty may throw if rid invalid in some environments
    // deno-lint-ignore no-explicit-any
    const anyDeno: any = Deno as any;
    return !!anyDeno?.isatty?.(Deno.stdout.rid);
  } catch {
    return false;
  }
}

const LOG_FORMAT = envStr("LOG_FORMAT", "both"); // pretty|json|both
const LOG_FILE = envStr("LOG_FILE", "./.logs/install.jsonl");
const USE_EMOJI = envBool("LOG_EMOJI", true);
const COLOR_ENABLED = isTTY() && !envBool("NO_COLOR", false);

// Simple colors
const codes = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function color(s: string, c?: keyof typeof codes): string {
  if (!COLOR_ENABLED || !c) return s;
  return `${codes[c]}${s}${codes.reset}`;
}

function badge(level: Level): string {
  const e = USE_EMOJI;
  switch (level) {
    case "SUCCESS":
      return (e ? "✅ " : "") + color("SUCCESS", "green");
    case "INFO":
      return (e ? "ℹ️  " : "") + color("INFO", "cyan");
    case "WARN":
      return (e ? "⚠️  " : "") + color("WARN", "yellow");
    case "ERROR":
      return (e ? "❌ " : "") + color("ERROR", "red");
    case "DEBUG":
      return (e ? "🔎 " : "") + color("DEBUG", "gray");
  }
}

function stepEmoji(ev: Event, ok?: boolean): string {
  if (!USE_EMOJI) return "";
  if (ev === "step_begin") return "🚀 ";
  if (ev === "step_end") return ok ? "✅ " : "❌ ";
  return "";
}

// JSONL file sink
let fileInitialized = false;
async function ensureFile(): Promise<void> {
  if (fileInitialized) return;
  const p = LOG_FILE;
  const dir = p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : ".";
  await Deno.mkdir(dir, { recursive: true }).catch(() => {});
  // Touch file
  await Deno.open(p, { create: true, append: true }).then((f) => f.close());
  fileInitialized = true;
}

async function writeJSONL(obj: BaseFields): Promise<void> {
  await ensureFile();
  const line = JSON.stringify(obj) + "\n";
  await Deno.writeTextFile(LOG_FILE, line, { append: true });
}

function writePretty({ lvl, ev, step, msg, ok, duration_ms }: BaseFields) {
  const parts: string[] = [];
  if (ev === "step_begin") {
    parts.push(stepEmoji(ev));
    parts.push(color("[" + (step ?? "step") + "]", "bold"));
    parts.push("begin");
  } else if (ev === "step_end") {
    parts.push(stepEmoji(ev, ok));
    parts.push(color("[" + (step ?? "step") + "]", "bold"));
    parts.push(ok ? color("ok", "green") : color("fail", "red"));
    if (duration_ms != null) {
      parts.push(color(`(${duration_ms} ms)`, "dim"));
    }
  } else {
    parts.push(badge(lvl));
    if (step) parts.push(color("[" + step + "]", "bold"));
    if (msg) parts.push(msg);
  }
  const line = parts.filter(Boolean).join(" ");
  console.log(line);
}

function nowIso(): string {
  return new Date().toISOString();
}

const stepStarts = new Map<string, number>();

async function emit(fields: Omit<BaseFields, "ts" | "version">) {
  const payload: BaseFields = {
    ts: nowIso(),
    version: VERSION,
    component: "scripts",
    ...fields,
  };

  if (LOG_FORMAT === "pretty" || LOG_FORMAT === "both") {
    writePretty(payload);
  }
  if (LOG_FORMAT === "json" || LOG_FORMAT === "both") {
    await writeJSONL(payload);
  }
}

export const log = {
  stepBegin: async (step: string) => {
    stepStarts.set(step, Date.now());
    await emit({ lvl: "INFO", ev: "step_begin", step });
  },
  stepEnd: async (
    step: string,
    opts: { ok: boolean; code?: number; error?: string },
  ) => {
    const started = stepStarts.get(step);
    const duration_ms = typeof started === "number"
      ? Date.now() - started
      : undefined;
    await emit({
      lvl: opts.ok ? "SUCCESS" : "ERROR",
      ev: "step_end",
      step,
      ok: opts.ok,
      code: opts.code,
      duration_ms,
      error: opts.error,
    });
    stepStarts.delete(step);
  },
  info: async (step: string | undefined, msg: string) => {
    await emit({ lvl: "INFO", ev: "log", step, msg });
  },
  warn: async (step: string | undefined, msg: string) => {
    await emit({ lvl: "WARN", ev: "log", step, msg });
  },
  error: async (step: string | undefined, msg: string) => {
    await emit({ lvl: "ERROR", ev: "log", step, msg });
  },
  success: async (step: string | undefined, msg: string) => {
    await emit({ lvl: "SUCCESS", ev: "log", step, msg });
  },
  debug: async (step: string | undefined, msg: string) => {
    await emit({ lvl: "DEBUG", ev: "log", step, msg });
  },
};

export type Logger = typeof log;
