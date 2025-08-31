import { Installer } from "../core/types.ts";
import { cmdExists } from "../core/utils.ts";
import $ from "jsr:@david/dax";

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
}

