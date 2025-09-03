import { UbuntuInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir, runSudo } from "../core/utils.ts";
import $ from "jsr:@david/dax";

export class FishUbuntuInstaller extends UbuntuInstaller {
  readonly name = "fish-ubuntu";

  override async pre() { await ensureDir(binDir()); }

  override async run() {
    if (await cmdExists("fish")) {
      await this.info("fish already installed; skipping");
      return;
    }
    await this.aptUpdate();
    await this.aptInstall("fish");
  }

  override async post() {
    if (!(await cmdExists("fish"))) throw new Error("verify: fish missing on PATH");
    // Always attempt to set default shell to fish if available
    const { stdout } = await $`sh -lc 'command -v fish'`.quiet();
    const fishPath = stdout.trim();
    if (!fishPath) return;

    // Ensure fish is listed in /etc/shells (non-fatal if we lack privileges)
    try {
      await runSudo(`sh -lc 'grep -qx ${fishPath} /etc/shells || echo ${fishPath} >> /etc/shells'`);
    } catch (err) {
      await this.warn(`could not update /etc/shells: ${String(err)}`);
    }

    // Detect current login shell
    const cur = await $`sh -lc 'getent passwd "$USER" 2>/dev/null | cut -d: -f7 || dscl . -read /Users/$(whoami) UserShell 2>/dev/null | awk "NR==1{print $2}" || printf %s "$SHELL"'`.quiet();
    const currentShell = cur.stdout.trim();
    if (currentShell === fishPath) {
      await this.info("default shell already fish; skipping chsh");
      return;
    }

    try {
      await $`chsh -s ${fishPath}`.quiet();
      await this.success("set default shell to fish");
    } catch {
      try {
        await runSudo(`chsh -s ${fishPath} $USER`);
        await this.success("set default shell to fish (sudo)");
      } catch (err) {
        await this.warn(`failed to set default shell: ${String(err)}`);
      }
    }
  }
}
