import $ from "jsr:@david/dax";
import { FedoraInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir, homeDir } from "../core/utils.ts";
import { join } from "jsr:@std/path";

export class FzfFedoraInstaller extends FedoraInstaller {
  readonly name = "fzf-fedora";

  override async pre() { await ensureDir(binDir()); }

  async run() {
    try { await this.dnfInstall("fzf"); }
    catch {
      const fzfDir = join(homeDir(), ".fzf");
      try {
        try { await $`test -d ${fzfDir}`.quiet(); await $`git -C ${fzfDir} pull --ff-only`.quiet(); }
        catch { try { await $`rm -rf ${fzfDir}`.quiet(); } catch {}; await $`git clone --depth 1 https://github.com/junegunn/fzf.git ${fzfDir}`; }
        await $`${join(fzfDir, "install")} --key-bindings --completion --no-update-rc`;
      } catch (e) {
        throw e;
      }
    }
  }

  override async post() {
    if (!(await cmdExists("fzf"))) throw new Error("fzf not found on PATH after install");
  }
}
