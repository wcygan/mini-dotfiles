import $ from "jsr:@david/dax";
import { FedoraInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir, safePATH } from "../core/utils.ts";
import { log } from "../../log.ts";

export class StarshipFedoraInstaller extends FedoraInstaller {
  readonly name = "starship-fedora";

  override async pre() {
    await ensureDir(binDir());
    try { Deno.env.set("PATH", safePATH()); } catch { /* ignore */ }
  }

  async run() {
    if (await cmdExists("starship")) {
      await log.info("install-software", "starship already installed; skipping");
      return;
    }
    // Prefer official script to keep consistent behavior and latest version
    const dst = binDir();
    await $`curl -fsSL https://starship.rs/install.sh | sh -s -- -y -b ${dst}`;
  }

  override async post() {
    if (!(await cmdExists("starship"))) throw new Error("starship not found after install");
  }
}
