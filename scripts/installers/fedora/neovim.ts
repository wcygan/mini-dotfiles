import { FedoraInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class NeovimFedoraInstaller extends FedoraInstaller {
  readonly name = "neovim-fedora";

  async run() {
    if (await cmdExists("nvim")) return;
    await this.dnfInstall("neovim");
  }

  async post() {
    if (!(await cmdExists("nvim"))) throw new Error("verify: nvim missing on PATH");
  }
}

