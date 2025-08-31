import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";
import $ from "jsr:@david/dax";

export class FzfMacInstaller extends MacInstaller {
  readonly name = "fzf-mac";

  override async run() {
    // Check if fzf is installed via brew; install if missing
    const listed = await $`brew list --versions fzf`.quiet().then(() => true, () => false);
    if (!listed) {
      await $`env HOMEBREW_NO_AUTO_UPDATE=1 brew install fzf`;
    }
    const { stdout: prefix } = await $`brew --prefix`.quiet();
    await $`${prefix.trim()}/opt/fzf/install --key-bindings --completion --no-update-rc`;
  }

  override async post() {
    if (!(await cmdExists("fzf"))) throw new Error("fzf not found on PATH after install");
  }
}
