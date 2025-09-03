import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class NeovimMacInstaller extends MacInstaller {
  readonly name = "neovim-mac";

  async run() {
    if (await cmdExists("nvim")) return;
    if (!(await this.brewInstalled("neovim"))) {
      await this.brewInstall("neovim");
    }
  }

  override async post() {
    if (!(await cmdExists("nvim"))) {
      throw new Error("verify: nvim missing on PATH");
    }
  }
}
