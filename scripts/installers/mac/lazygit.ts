import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";
import { log } from "../../log.ts";
import $ from "jsr:@david/dax";

export class LazyGitMacInstaller extends MacInstaller {
  readonly name = "lazygit-mac";

  async run() {
    if (await cmdExists("lazygit")) {
      await log.info("install-software", "lazygit already installed; skipping");
      return;
    }
    await $`env HOMEBREW_NO_AUTO_UPDATE=1 brew list --versions lazygit >/dev/null 2>&1 || env HOMEBREW_NO_AUTO_UPDATE=1 brew install lazygit`;
  }

  async post() {
    if (!(await cmdExists("lazygit"))) throw new Error("lazygit not found after install");
  }
}

