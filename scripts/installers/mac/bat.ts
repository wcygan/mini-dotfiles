import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";
import $ from "jsr:@david/dax";

export class BatMacInstaller extends MacInstaller {
  readonly name = "bat-mac";

  async run() {
    if (await cmdExists("bat")) return;
    const listed = await $`brew list --versions bat`.quiet().then(() => true, () => false);
    if (!listed) await $`env HOMEBREW_NO_AUTO_UPDATE=1 brew install bat`;
  }

  async post() {
    if (!(await cmdExists("bat"))) throw new Error("verify: bat missing on PATH");
  }
}

