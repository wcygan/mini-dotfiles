import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";
import $ from "jsr:@david/dax";

export class LazyGitMacInstaller extends MacInstaller {
  readonly name = "lazygit-mac";

  override async run() {
    if (await cmdExists("lazygit")) {
      await this.info("lazygit already installed; skipping");
      return;
    }
    const listed = await $`brew list --versions lazygit`.quiet().then(() => true, () => false);
    if (!listed) {
      await $`env HOMEBREW_NO_AUTO_UPDATE=1 brew install lazygit`;
    }
  }

  override async post() {
    if (!(await cmdExists("lazygit"))) throw new Error("verify: lazygit missing on PATH");
  }
}
