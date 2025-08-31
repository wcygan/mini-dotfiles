import { Installer } from "../core/types.ts";
import { runSudo } from "../core/utils.ts";

export abstract class FedoraInstaller implements Installer {
  abstract readonly name: string;
  async shouldRun() { return true; }
  async pre() {}
  abstract run(): Promise<void>;
  async post() {}

  protected async dnfInstall(...pkgs: string[]) {
    if (pkgs.length === 0) return;
    await runSudo(`dnf install -y ${pkgs.map(escape).join(" ")}`);
  }
}

