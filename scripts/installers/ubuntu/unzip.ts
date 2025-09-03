import { UbuntuInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class UnzipUbuntuInstaller extends UbuntuInstaller {
  readonly name = "unzip-ubuntu";

  async run() {
    if (await cmdExists("unzip")) return;
    await this.aptUpdate();
    await this.aptInstall("unzip");
  }

  async post() {
    if (!(await cmdExists("unzip"))) {
      throw new Error("verify: unzip missing on PATH");
    }
  }
}
