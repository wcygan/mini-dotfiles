import { UbuntuInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir } from "../core/utils.ts";
import { join } from "jsr:@std/path";

export class FdUbuntuInstaller extends UbuntuInstaller {
  readonly name = "fd-ubuntu";

  async pre() {
    await ensureDir(binDir());
  }

  async run() {
    // On Debian/Ubuntu the package is "fd-find" and the binary is "fdfind".
    if (await cmdExists("fd")) return;
    await this.aptUpdate();
    await this.aptInstall("fd-find");
  }

  async post() {
    // Provide a friendly "fd" shim to "fdfind"
    const dst = join(binDir(), "fd");
    try {
      if (!(await cmdExists("fd")) && await cmdExists("fdfind")) {
        await Deno.remove(dst).catch(() => {});
        await Deno.symlink(await which("fdfind"), dst);
      }
    } catch {}
    if (!(await cmdExists("fd"))) throw new Error("verify: fd missing on PATH");
  }
}

async function which(cmd: string): Promise<string> {
  const p = new Deno.Command("sh", { args: ["-lc", `command -v ${cmd}`] })
    .outputSync();
  return new TextDecoder().decode(p.stdout).trim();
}
