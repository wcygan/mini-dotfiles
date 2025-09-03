import { UbuntuInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir } from "../core/utils.ts";
import { ensureUpstreamFzf } from "../core/toolkit.ts";

export class FzfUbuntuInstaller extends UbuntuInstaller {
  readonly name = "fzf-ubuntu";

  override async pre() {
    await ensureDir(binDir());
  }

  override async run() {
    if (await cmdExists("fzf")) return;
    // Prefer upstream (newer + provides integration), fallback to apt
    try {
      await ensureUpstreamFzf(true);
      return;
    } catch {
      await this.aptUpdate();
      await this.aptInstall("fzf", "gzip", "bash-completion");
    }
  }

  override async post() {
    if (!(await cmdExists("fzf"))) {
      throw new Error("verify: fzf missing on PATH");
    }
  }
}
