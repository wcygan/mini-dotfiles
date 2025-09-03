import { FedoraInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir } from "../core/utils.ts";
import { ensureUpstreamFzf } from "../core/toolkit.ts";

export class FzfFedoraInstaller extends FedoraInstaller {
  readonly name = "fzf-fedora";

  override async pre() {
    await ensureDir(binDir());
  }

  async run() {
    if (await cmdExists("fzf")) return;
    try {
      await this.dnfInstall("fzf");
    } catch {
      await ensureUpstreamFzf(true);
    }
  }

  override async post() {
    if (!(await cmdExists("fzf"))) {
      throw new Error("verify: fzf missing on PATH");
    }
  }
}
