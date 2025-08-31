import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class JqMacInstaller extends MacInstaller {
  readonly name = "jq-mac";

  async run() {
    if (await cmdExists("jq")) return;
    if (!(await this.brewInstalled("jq"))) {
      await this.brewInstall("jq");
    }
  }

  override async post() {
    if (!(await cmdExists("jq"))) throw new Error("verify: jq missing on PATH");
  }
}
