import { Installer } from "../core/types.ts";
import { runSudo } from "../core/utils.ts";
import { log } from "../../log.ts";

export abstract class UbuntuInstaller implements Installer {
  abstract readonly name: string;
  async shouldRun() { return true; }
  async pre() {}
  abstract run(): Promise<void>;
  async post() {}

  protected async aptUpdate() { await runSudo("apt-get update -y"); }
  protected async aptInstall(...pkgs: string[]) {
    if (pkgs.length === 0) return;
    await runSudo(`apt-get install -y ${pkgs.map(escape).join(" ")}`);
  }

  // Scoped logging bound to: install-<tool-os>
  protected info(msg: string)    { return log.info(`install-${this.name}`, msg); }
  protected warn(msg: string)    { return log.warn(`install-${this.name}`, msg); }
  protected error(msg: string)   { return log.error(`install-${this.name}`, msg); }
  protected success(msg: string) { return log.success(`install-${this.name}`, msg); }
  protected debug(msg: string)   { return log.debug(`install-${this.name}`, msg); }
}
