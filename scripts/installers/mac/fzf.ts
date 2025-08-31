import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";
import $ from "jsr:@david/dax";

export class FzfMacInstaller extends MacInstaller {
  readonly name = "fzf-mac";

  async run() {
    await $`env HOMEBREW_NO_AUTO_UPDATE=1 brew list --versions fzf >/dev/null 2>&1 || env HOMEBREW_NO_AUTO_UPDATE=1 brew install fzf`;
    const { stdout: prefix } = await $`brew --prefix`.quiet();
    await $`${prefix.trim()}/opt/fzf/install --key-bindings --completion --no-update-rc`;
  }

  async post() {
    if (!(await cmdExists("fzf"))) throw new Error("fzf not found on PATH after install");
  }
}

