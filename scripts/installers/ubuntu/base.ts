import { Installer } from "../core/types.ts";
import { runSudo } from "../core/utils.ts";

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
}

