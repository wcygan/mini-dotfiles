import { UbuntuInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class NeovimUbuntuInstaller extends UbuntuInstaller {
  readonly name = "neovim-ubuntu";

  async run() {
    if (await cmdExists("nvim")) return;
    await this.aptUpdate();
    await this.aptInstall("neovim");
  }

  async post() {
    if (!(await cmdExists("nvim"))) {
      throw new Error("verify: nvim missing on PATH");
    }
  }
}
