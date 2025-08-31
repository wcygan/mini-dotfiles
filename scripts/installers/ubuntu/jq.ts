import { UbuntuInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class JqUbuntuInstaller extends UbuntuInstaller {
  readonly name = "jq-ubuntu";

  async run() {
    if (await cmdExists("jq")) return;
    await this.aptUpdate();
    await this.aptInstall("jq");
  }

  async post() {
    if (!(await cmdExists("jq"))) throw new Error("verify: jq missing on PATH");
  }
}

