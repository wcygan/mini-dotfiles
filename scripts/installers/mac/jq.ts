import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";
import $ from "jsr:@david/dax";

export class JqMacInstaller extends MacInstaller {
  readonly name = "jq-mac";

  async run() {
    if (await cmdExists("jq")) return;
    const listed = await $`brew list --versions jq`.quiet().then(() => true, () => false);
    if (!listed) await $`env HOMEBREW_NO_AUTO_UPDATE=1 brew install jq`;
  }

  async post() {
    if (!(await cmdExists("jq"))) throw new Error("verify: jq missing on PATH");
  }
}

