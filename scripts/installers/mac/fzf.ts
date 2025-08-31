import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";
import $ from "jsr:@david/dax";

export class FzfMacInstaller extends MacInstaller {
  readonly name = "fzf-mac";

  override async run() {
    if (await cmdExists("fzf")) return;
    if (!(await this.brewInstalled("fzf"))) {
      await this.brewInstall("fzf");
    }
    const prefix = await this.brewPrefix();
    await $`${prefix}/opt/fzf/install --key-bindings --completion --no-update-rc`;
  }

  override async post() {
    if (!(await cmdExists("fzf"))) throw new Error("verify: fzf missing on PATH");
  }
}
