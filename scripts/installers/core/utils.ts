import $ from "jsr:@david/dax";
import { join } from "jsr:@std/path";

export async function cmdExists(cmd: string): Promise<boolean> {
  try {
    const extraPaths = [binDir(), join(homeDir(), ".fzf", "bin")];
    const current = Deno.env.get("PATH") ?? "";
    const path = [...extraPaths, ...current.split(":").filter(Boolean)].join(":");
    await $`sh -lc 'command -v ${cmd} >/dev/null 2>&1'`.env({ PATH: path }).quiet();
    return true;
  } catch {
    return false;
  }
}

export async function isRoot(): Promise<boolean> {
  try {
    const { stdout } = await $`sh -lc 'id -u'`.quiet();
    return stdout.trim() === "0";
  } catch {
    return false;
  }
}

export async function runSudo(cmd: string) {
  const root = await isRoot();
  if (root) return await $`sh -lc ${cmd}`;
  if (await cmdExists("sudo")) return await $`sudo sh -lc ${cmd}`;
  throw new Error("Need root or sudo: " + cmd);
}

export function homeDir(): string {
  const h = Deno.env.get("HOME");
  if (!h) throw new Error("HOME not set");
  return h;
}

export async function ensureDir(p: string) {
  await Deno.mkdir(p, { recursive: true }).catch(() => {});
}

export function binDir(): string {
  return join(homeDir(), ".local", "bin");
}

export function safePATH(): string {
  const systemFirst = [
    "/usr/bin",
    "/bin",
    "/usr/sbin",
    "/sbin",
    "/opt/homebrew/bin",
    "/usr/local/bin",
  ];
  const current = (Deno.env.get("PATH") ?? "").split(":").filter(Boolean);
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const p of [...systemFirst, ...current]) if (!seen.has(p)) { parts.push(p); seen.add(p); }
  return parts.join(":");
}
