import { MacInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir } from "../core/utils.ts";
import { ensureDefaultShell } from "../core/toolkit.ts";

export class FishMacInstaller extends MacInstaller {
  readonly name = "fish-mac";

  override async pre() {
    await super.pre();
    await ensureDir(binDir());
  }

  override async run() {
    if (await cmdExists("fish")) {
      await this.info("fish already installed; skipping");
      return;
    }
    await this.brewInstall("fish");
  }

  override async post() {
    if (!(await cmdExists("fish"))) {
      throw new Error("verify: fish missing on PATH");
    }
    const { path, changed } = await ensureDefaultShell("fish");
    if (changed) await this.success("set default shell to fish");
    else await this.info(`default shell unchanged (current: ${path})`);
  }
}
