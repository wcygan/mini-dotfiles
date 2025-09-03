// deno-lint-ignore-file no-explicit-any
import { log } from "../../log.ts";

export type OS = "ubuntu" | "fedora" | "mac";

export interface Installer {
  readonly name: string;
  shouldRun?(): Promise<boolean>;
  pre(): Promise<void>;
  run(): Promise<void>;
  post(): Promise<void>;
}

export async function runInstaller(i: Installer) {
  const STEP = `install-${i.name}`;
  await log.stepBegin(STEP);
  try {
    if (i.shouldRun) {
      const ok = await i.shouldRun();
      if (!ok) {
        await log.info(STEP, "skipping (shouldRun=false)");
        await log.stepEnd(STEP, { ok: true });
        return;
      }
    }
    await i.pre();
    await i.run();
    await i.post();
    await log.stepEnd(STEP, { ok: true });
  } catch (err) {
    const msg = err instanceof Error ? (err.stack ?? err.message) : String(err);
    await log.error(STEP, `failed: ${msg}`);
    await log.stepEnd(STEP, { ok: false, error: msg });
    throw err;
  }
}

export async function detectOS(): Promise<OS> {
  if (Deno.build.os === "darwin") return "mac";
  if (Deno.build.os === "linux") {
    try {
      const txt = await Deno.readTextFile("/etc/os-release");
      const id = (txt.match(/^ID=(.*)$/m)?.[1] ?? "")
        .replace(/"/g, "")
        .trim()
        .toLowerCase();
      const idLikeRaw = (txt.match(/^ID_LIKE=(.*)$/m)?.[1] ?? "")
        .replace(/"/g, "")
        .trim()
        .toLowerCase();
      const idLikes = idLikeRaw.split(/\s+/).filter(Boolean);

      // Fedora family: fedora variants (e.g., fedora-asahi-remix), RHEL clones use dnf
      const isFedoraFamily =
        id.includes("fedora") ||
        idLikes.includes("fedora") ||
        idLikes.includes("rhel") ||
        idLikes.includes("centos") ||
        idLikes.includes("rocky") ||
        idLikes.includes("almalinux");
      if (isFedoraFamily) return "fedora";

      // Debian/Ubuntu family
      const isDebianFamily =
        id === "ubuntu" ||
        id === "debian" ||
        idLikes.includes("ubuntu") ||
        idLikes.includes("debian");
      if (isDebianFamily) return "ubuntu";
    } catch {
      // ignore
    }
  }
  return "ubuntu";
}
