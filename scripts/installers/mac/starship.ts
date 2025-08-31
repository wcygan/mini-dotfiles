import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";
import { log } from "../../log.ts";
import $ from "jsr:@david/dax";

export class StarshipMacInstaller extends MacInstaller {
  readonly name = "starship-mac";

  async run() {
    if (await cmdExists("starship")) {
      await log.info("install-software", "starship already installed; skipping");
      return;
    }
    await $`env HOMEBREW_NO_AUTO_UPDATE=1 brew list --versions starship >/dev/null 2>&1 || env HOMEBREW_NO_AUTO_UPDATE=1 brew install starship`;
  }

  async post() {
    if (!(await cmdExists("starship"))) throw new Error("starship not found after install");
  }
}

