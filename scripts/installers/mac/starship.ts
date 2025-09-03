import { MacInstaller } from "./base.ts";
import { cmdExists } from "../core/utils.ts";

export class StarshipMacInstaller extends MacInstaller {
  readonly name = "starship-mac";

  override async run() {
    if (await cmdExists("starship")) {
      await this.info("starship already installed; skipping");
      return;
    }
    if (!(await this.brewInstalled("starship"))) {
      await this.brewInstall("starship");
    }
  }

  override async post() {
    if (!(await cmdExists("starship"))) {
      throw new Error("verify: starship missing on PATH");
    }
  }
}
