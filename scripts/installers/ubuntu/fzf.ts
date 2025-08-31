import $ from "jsr:@david/dax";
import { UbuntuInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir, homeDir } from "../core/utils.ts";
import { join } from "jsr:@std/path";

export class FzfUbuntuInstaller extends UbuntuInstaller {
  readonly name = "fzf-ubuntu";

  async pre() { await ensureDir(binDir()); }

  async run() {
    const fzfDir = join(homeDir(), ".fzf");
    try {
      try { await $`test -d ${fzfDir}`.quiet(); await $`git -C ${fzfDir} pull --ff-only`.quiet(); }
      catch { await $`rm -rf ${fzfDir}`.quiet().catch(()=>{}); await $`git clone --depth 1 https://github.com/junegunn/fzf.git ${fzfDir}`; }
      await $`${join(fzfDir, "install")} --key-bindings --completion --no-update-rc`;
    } catch {
      await this.aptUpdate();
      await this.aptInstall("fzf");
    }
  }

  async post() {
    if (!(await cmdExists("fzf"))) throw new Error("fzf not found on PATH after install");
  }
}

