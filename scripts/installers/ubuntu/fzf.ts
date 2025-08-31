import $ from "jsr:@david/dax";
import { UbuntuInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir, homeDir } from "../core/utils.ts";
import { join } from "jsr:@std/path";

export class FzfUbuntuInstaller extends UbuntuInstaller {
  readonly name = "fzf-ubuntu";

  override async pre() { await ensureDir(binDir()); }

  override async run() {
    // Prefer system package first (deterministic binary location, fast)
    await this.aptUpdate();
    // Include gzip to allow sourcing gzipped example scripts in minimal images
    await this.aptInstall("fzf", "gzip");

    // If system integration files are missing (common on minimal images),
    // lay down user-level integration under ~/.fzf without touching rc files.
    const hasSysBash = await $`sh -lc 'test -f /usr/share/fzf/key-bindings.bash || \
                                     test -f /usr/share/doc/fzf/examples/key-bindings.bash || \
                                     test -f /usr/share/bash-completion/completions/fzf'`
      .quiet()
      .then(() => true, () => false);

    if (!hasSysBash) {
      const fzfDir = join(homeDir(), ".fzf");
      try {
        try {
          await $`test -d ${fzfDir}`.quiet();
          await $`git -C ${fzfDir} pull --ff-only`.quiet();
        } catch {
          try { await $`rm -rf ${fzfDir}`.quiet(); } catch {}
          await $`git clone --depth 1 https://github.com/junegunn/fzf.git ${fzfDir}`;
        }
        await $`${join(fzfDir, "install")} --key-bindings --completion --no-update-rc`;
      } catch {
        // Ignore: binary already provided by apt; fallbacks in rc will handle integration
      }
    }
  }

  override async post() {
    if (!(await cmdExists("fzf"))) throw new Error("fzf not found on PATH after install");
  }
}
