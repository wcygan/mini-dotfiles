import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";
import $ from "jsr:@david/dax";

export class FdMacInstaller extends MacInstaller {
  readonly name = "fd-mac";

  async run() {
    if (await cmdExists("fd")) return;
    const listed = await $`brew list --versions fd`.quiet().then(() => true, () => false);
    if (!listed) await $`env HOMEBREW_NO_AUTO_UPDATE=1 brew install fd`;
  }

  async post() {
    if (!(await cmdExists("fd"))) throw new Error("verify: fd missing on PATH");
  }
}

