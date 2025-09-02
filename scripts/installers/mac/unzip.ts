import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class UnzipMacInstaller extends MacInstaller {
  readonly name = "unzip-mac";

  async run() {
    if (await cmdExists("unzip")) return;
    // macOS typically ships /usr/bin/unzip; fallback to Homebrew if missing.
    if (!(await this.brewInstalled("unzip"))) {
      await this.brewInstall("unzip");
    }
  }

  async post() {
    if (!(await cmdExists("unzip"))) throw new Error("verify: unzip missing on PATH");
  }
}

