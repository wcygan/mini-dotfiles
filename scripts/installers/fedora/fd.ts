import { FedoraInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class FdFedoraInstaller extends FedoraInstaller {
  readonly name = "fd-fedora";

  async run() {
    if (await cmdExists("fd")) return;
    // Some Fedora variants package as "fd-find", which still installs "fd"
    try {
      await this.dnfInstall("fd");
    } catch {
      await this.dnfInstall("fd-find");
    }
  }

  async post() {
    if (!(await cmdExists("fd"))) throw new Error("verify: fd missing on PATH");
  }
}
