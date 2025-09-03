import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class LazyGitMacInstaller extends MacInstaller {
  readonly name = "lazygit-mac";

  override async run() {
    if (await cmdExists("lazygit")) {
      await this.info("lazygit already installed; skipping");
      return;
    }
    if (!(await this.brewInstalled("lazygit"))) {
      await this.brewInstall("lazygit");
    }
  }

  override async post() {
    if (!(await cmdExists("lazygit"))) {
      throw new Error("verify: lazygit missing on PATH");
    }
  }
}
