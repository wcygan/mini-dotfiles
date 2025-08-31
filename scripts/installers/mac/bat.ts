import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class BatMacInstaller extends MacInstaller {
  readonly name = "bat-mac";

  async run() {
    if (await cmdExists("bat")) return;
    if (!(await this.brewInstalled("bat"))) {
      await this.brewInstall("bat");
    }
  }

  override async post() {
    if (!(await cmdExists("bat"))) throw new Error("verify: bat missing on PATH");
  }
}
