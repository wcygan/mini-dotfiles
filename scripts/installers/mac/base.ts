import { Installer } from "../core/types.ts";
import { cmdExists } from "../core/utils.ts";
import $ from "jsr:@david/dax";
import { log } from "../../log.ts";

export abstract class MacInstaller implements Installer {
  abstract readonly name: string;
  async shouldRun() {
    return true;
  }
  async pre() {
    await this.ensureBrew();
  }
  abstract run(): Promise<void>;
  async post() {}

  protected async ensureBrew() {
    if (await cmdExists("brew")) return;
    await $`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`;
  }

  /** Return true if a formula (or cask) is installed according to brew. */
  protected async brewInstalled(name: string): Promise<boolean> {
    // `brew list --versions <name>` exits 0 when installed
    return await $`brew list --versions ${name}`.quiet().then(
      () => true,
      () => false,
    );
  }

  /** Install one or more formulas with auto-update disabled (idempotent upstream). */
  protected async brewInstall(...pkgs: string[]) {
    if (pkgs.length === 0) return;
    await $`env HOMEBREW_NO_AUTO_UPDATE=1 brew install ${pkgs}`;
  }

  /** Optionally install casks the same way (kept separate for clarity). */
  protected async brewInstallCask(...casks: string[]) {
    if (casks.length === 0) return;
    await $`env HOMEBREW_NO_AUTO_UPDATE=1 brew install --cask ${casks}`;
  }

  /** `brew --prefix`, trimmed. Useful for post-install integration paths. */
  protected async brewPrefix(): Promise<string> {
    const { stdout } = await $`brew --prefix`.quiet();
    return stdout.trim();
  }

  /** Add a tap if missing. No-ops if it already exists. */
  protected async brewTap(tap: string) {
    const tapped = await $`brew tap`.quiet();
    if (!tapped.stdout.split("\n").some((t) => t.trim() === tap)) {
      await $`brew tap ${tap}`;
    }
  }

  protected info(msg: string) {
    return log.info(`install-${this.name}`, msg);
  }
  protected warn(msg: string) {
    return log.warn(`install-${this.name}`, msg);
  }
  protected error(msg: string) {
    return log.error(`install-${this.name}`, msg);
  }
  protected success(msg: string) {
    return log.success(`install-${this.name}`, msg);
  }
  protected debug(msg: string) {
    return log.debug(`install-${this.name}`, msg);
  }
}
