import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";
import $ from "jsr:@david/dax";

export class NeovimMacInstaller extends MacInstaller {
  readonly name = "neovim-mac";

  async run() {
    if (await cmdExists("nvim")) return;
    const listed = await $`brew list --versions neovim`.quiet().then(() => true, () => false);
    if (!listed) await $`env HOMEBREW_NO_AUTO_UPDATE=1 brew install neovim`;
  }

  async post() {
    if (!(await cmdExists("nvim"))) throw new Error("verify: nvim missing on PATH");
  }
}

