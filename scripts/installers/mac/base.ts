import { Installer } from "../core/types.ts";
import { cmdExists } from "../core/utils.ts";
import $ from "jsr:@david/dax";
import { log } from "../../log.ts";

export abstract class MacInstaller implements Installer {
  abstract readonly name: string;
  async shouldRun() { return true; }
  async pre() { await this.ensureBrew(); }
  abstract run(): Promise<void>;
  async post() {}

  protected async ensureBrew() {
    if (await cmdExists("brew")) return;
    await $`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`;
  }

  protected info(msg: string)    { return log.info(`install-${this.name}`, msg); }
  protected warn(msg: string)    { return log.warn(`install-${this.name}`, msg); }
  protected error(msg: string)   { return log.error(`install-${this.name}`, msg); }
  protected success(msg: string) { return log.success(`install-${this.name}`, msg); }
  protected debug(msg: string)   { return log.debug(`install-${this.name}`, msg); }
}
