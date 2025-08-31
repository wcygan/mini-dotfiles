import { FedoraInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class BatFedoraInstaller extends FedoraInstaller {
  readonly name = "bat-fedora";

  async run() {
    if (await cmdExists("bat")) return;
    await this.dnfInstall("bat");
  }

  async post() {
    if (!(await cmdExists("bat"))) throw new Error("verify: bat missing on PATH");
  }
}

