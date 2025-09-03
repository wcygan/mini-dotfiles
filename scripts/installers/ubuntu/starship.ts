import $ from "jsr:@david/dax";
import { UbuntuInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir } from "../core/utils.ts";

export class StarshipUbuntuInstaller extends UbuntuInstaller {
  readonly name = "starship-ubuntu";

  override async pre() {
    await ensureDir(binDir());
  }

  async run() {
    if (await cmdExists("starship")) {
      await this.info("starship already installed; skipping");
      return;
    }
    const dst = binDir();
    await $`curl -fsSL https://starship.rs/install.sh | sh -s -- -y -b ${dst}`;
  }

  override async post() {
    if (!(await cmdExists("starship"))) {
      throw new Error("verify: starship missing on PATH");
    }
  }
}
