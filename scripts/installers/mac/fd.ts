import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class FdMacInstaller extends MacInstaller {
  readonly name = "fd-mac";

  async run() {
    if (await cmdExists("fd")) return;
    if (!(await this.brewInstalled("fd"))) {
      await this.brewInstall("fd");
    }
  }

  override async post() {
    if (!(await cmdExists("fd"))) throw new Error("verify: fd missing on PATH");
  }
}
