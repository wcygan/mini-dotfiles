import { FedoraInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir } from "../core/utils.ts";
import { log } from "../../log.ts";
import $ from "jsr:@david/dax";
import { installTarballBinary, ghLatestRedirect } from "../core/toolkit.ts";

export class LazyGitFedoraInstaller extends FedoraInstaller {
  readonly name = "lazygit-fedora";

  override async pre() { await ensureDir(binDir()); }

  async run() {
    if (await cmdExists("lazygit")) {
      await log.info("install-software", "lazygit already installed; skipping");
      return;
    }

    try {
      await this.dnfInstall("lazygit");
      return;
    } catch {
      // not in default repos, try COPR
      try {
        await this.dnfInstall("dnf-plugins-core");
        await $`dnf -y copr enable atim/lazygit`;
        await this.dnfInstall("lazygit");
        return;
      } catch {
        // fall through to upstream tarball
      }
    }

    const arch = Deno.build.arch === "x86_64" ? "x86_64"
              : Deno.build.arch === "aarch64" ? "arm64"
              : "";
    if (!arch) throw new Error(`unsupported arch ${Deno.build.arch}`);
    const eff = await ghLatestRedirect("jesseduffield/lazygit");
    const tag = eff.split("/").pop() ?? ""; // e.g., v0.54.2
    const version = tag.replace(/^v/, "");
    const url = version
      ? `https://github.com/jesseduffield/lazygit/releases/download/${tag}/lazygit_${version}_Linux_${arch}.tar.gz`
      : `https://github.com/jesseduffield/lazygit/releases/latest/download/lazygit_Linux_${arch}.tar.gz`;
    await installTarballBinary({ url, binName: "lazygit" });
  }

  override async post() {
    if (!(await cmdExists("lazygit"))) throw new Error("verify: lazygit missing on PATH");
  }
}
