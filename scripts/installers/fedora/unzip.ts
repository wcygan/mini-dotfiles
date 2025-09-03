import { FedoraInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class UnzipFedoraInstaller extends FedoraInstaller {
  readonly name = "unzip-fedora";

  async run() {
    if (await cmdExists("unzip")) return;
    await this.dnfInstall("unzip");
  }

  async post() {
    if (!(await cmdExists("unzip"))) {
      throw new Error("verify: unzip missing on PATH");
    }
  }
}
