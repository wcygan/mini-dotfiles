import $ from "jsr:@david/dax";
import { UbuntuInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir, homeDir } from "../core/utils.ts";
import { join } from "jsr:@std/path";

export class FzfUbuntuInstaller extends UbuntuInstaller {
  readonly name = "fzf-ubuntu";

  override async pre() { await ensureDir(binDir()); }

  override async run() {
    // Prefer upstream (newer + provides self-printing integration), fallback to apt
    const fzfDir = join(homeDir(), ".fzf");
    try {
      try { await $`test -d ${fzfDir}`.quiet(); await $`git -C ${fzfDir} pull --ff-only`.quiet(); }
      catch { try { await $`rm -rf ${fzfDir}`.quiet(); } catch {}; await $`git clone --depth 1 https://github.com/junegunn/fzf.git ${fzfDir}`; }
      await $`${join(fzfDir, "install")} --key-bindings --completion --no-update-rc`;
      return;
    } catch {
      // fall back to apt if upstream unavailable
      await this.aptUpdate();
      await this.aptInstall("fzf", "gzip", "bash-completion");

      // If system integration files are missing (common on minimal images),
      // lay down user-level integration under ~/.fzf without touching rc files.
      const hasSysBash = await $`sh -lc 'test -f /usr/share/fzf/key-bindings.bash || \
                                       test -f /usr/share/doc/fzf/examples/key-bindings.bash || \
                                       test -f /usr/share/bash-completion/completions/fzf'`
        .quiet()
        .then(() => true, () => false);

      if (!hasSysBash) {
        try {
          try { await $`test -d ${fzfDir}`.quiet(); await $`git -C ${fzfDir} pull --ff-only`.quiet(); }
          catch { try { await $`rm -rf ${fzfDir}`.quiet(); } catch {}; await $`git clone --depth 1 https://github.com/junegunn/fzf.git ${fzfDir}`; }
          await $`${join(fzfDir, "install")} --key-bindings --completion --no-update-rc`;
        } catch {
          // Ignore: apt provided binary; bashrc fallbacks handle what is available
        }
      }
    }
  }

  override async post() {
    if (!(await cmdExists("fzf"))) throw new Error("fzf not found on PATH after install");
  }
}
