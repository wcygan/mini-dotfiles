import { Installer } from "../core/types.ts";
import { runSudo } from "../core/utils.ts";
import { log } from "../../log.ts";

export abstract class UbuntuInstaller implements Installer {
  abstract readonly name: string;
  async shouldRun() {
    return true;
  }
  async pre() {}
  abstract run(): Promise<void>;
  async post() {}

  protected async aptUpdate() {
    await runSudo("apt-get update -y");
  }
  protected async aptInstall(...pkgs: string[]) {
    if (pkgs.length === 0) return;
    await runSudo(`apt-get install -y ${pkgs.map(escape).join(" ")}`);
  }

  /** Read Ubuntu VERSION_ID from /etc/os-release (e.g., "25.10"). */
  protected async ubuntuVersionId(): Promise<string | null> {
    try {
      const txt = await Deno.readTextFile("/etc/os-release");
      const m = txt.match(/^VERSION_ID="?([^"]+)"?/m);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  }

  /** Compare dotted versions, returns true when a >= b (numeric segments). */
  protected versionGte(a: string, b: string): boolean {
    const pa = a.split(".").map((x) => parseInt(x, 10));
    const pb = b.split(".").map((x) => parseInt(x, 10));
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const av = pa[i] ?? 0;
      const bv = pb[i] ?? 0;
      if (av > bv) return true;
      if (av < bv) return false;
    }
    return true; // equal
  }

  // Scoped logging bound to: install-<tool-os>
  protected info(msg: string) {
    return log.info(`install-${this.name}`, msg);
  }
  protected warn(msg: string) {
    return log.warn(`install-${this.name}`, msg);
  }
  protected error(msg: string) {
    return log.error(`install-${this.name}`, msg);
  }
  protected success(msg: string) {
    return log.success(`install-${this.name}`, msg);
  }
  protected debug(msg: string) {
    return log.debug(`install-${this.name}`, msg);
  }
}
