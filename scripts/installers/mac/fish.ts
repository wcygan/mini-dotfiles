import { MacInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir } from "../core/utils.ts";
import $ from "jsr:@david/dax";

export class FishMacInstaller extends MacInstaller {
  readonly name = "fish-mac";

  override async pre() { await super.pre(); await ensureDir(binDir()); }

  override async run() {
    if (await cmdExists("fish")) {
      await this.info("fish already installed; skipping");
      return;
    }
    await this.brewInstall("fish");
  }

  override async post() {
    if (!(await cmdExists("fish"))) throw new Error("verify: fish missing on PATH");
    // Always attempt to set default shell to fish if available
    const { stdout } = await $`sh -lc 'command -v fish'`.quiet();
    const fishPath = stdout.trim();
    if (!fishPath) return;

    // On macOS, append to /etc/shells if missing (needs sudo typically)
    try {
      await $`sh -lc 'grep -qx ${fishPath} /etc/shells || echo ${fishPath} | sudo tee -a /etc/shells >/dev/null'`;
    } catch {
      // ignore, best-effort
    }

    const cur = await $`sh -lc 'dscl . -read /Users/$(whoami) UserShell 2>/dev/null | awk "NR==1{print $2}" || printf %s "$SHELL"'`.quiet();
    const currentShell = cur.stdout.trim();
    if (currentShell === fishPath) {
      await this.info("default shell already fish; skipping chsh");
      return;
    }

    try {
      await $`chsh -s ${fishPath}`.quiet();
      await this.success("set default shell to fish");
    } catch (err) {
      await this.warn(`failed to chsh without prompt: ${String(err)}`);
    }
  }
}
