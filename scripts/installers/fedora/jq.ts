import { FedoraInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class JqFedoraInstaller extends FedoraInstaller {
  readonly name = "jq-fedora";

  async run() {
    if (await cmdExists("jq")) return;
    await this.dnfInstall("jq");
  }

  async post() {
    if (!(await cmdExists("jq"))) throw new Error("verify: jq missing on PATH");
  }
}

