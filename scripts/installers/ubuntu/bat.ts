import { UbuntuInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir } from "../core/utils.ts";
import { join } from "jsr:@std/path";

export class BatUbuntuInstaller extends UbuntuInstaller {
  readonly name = "bat-ubuntu";

  async pre() {
    await ensureDir(binDir());
  }

  async run() {
    // On Debian/Ubuntu the binary is "batcat" in the "bat" package.
    if (await cmdExists("bat")) return;
    await this.aptUpdate();
    await this.aptInstall("bat");
  }

  async post() {
    // Provide a friendly "bat" shim to "batcat"
    const target = "/usr/bin/batcat";
    const dst = join(binDir(), "bat");
    try {
      if (!(await cmdExists("bat")) && await cmdExists("batcat")) {
        await Deno.remove(dst).catch(() => {});
        await Deno.symlink(target, dst);
      }
    } catch {}
    if (!(await cmdExists("bat"))) {
      throw new Error("verify: bat missing on PATH");
    }
  }
}
