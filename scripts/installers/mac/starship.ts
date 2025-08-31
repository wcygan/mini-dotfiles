import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";
import $ from "jsr:@david/dax";

export class StarshipMacInstaller extends MacInstaller {
  readonly name = "starship-mac";

  override async run() {
    if (await cmdExists("starship")) {
      await this.info("starship already installed; skipping");
      return;
    }
    const listed = await $`brew list --versions starship`.quiet().then(() => true, () => false);
    if (!listed) {
      await $`env HOMEBREW_NO_AUTO_UPDATE=1 brew install starship`;
    }
  }

  override async post() {
    if (!(await cmdExists("starship"))) throw new Error("verify: starship missing on PATH");
  }
}
