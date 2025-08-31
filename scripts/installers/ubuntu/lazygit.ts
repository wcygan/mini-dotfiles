import { UbuntuInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir } from "../core/utils.ts";
import { installTarballBinary, ghLatestRedirect } from "../core/toolkit.ts";

export class LazyGitUbuntuInstaller extends UbuntuInstaller {
  readonly name = "lazygit-ubuntu";

  override async pre() { await ensureDir(binDir()); }

  override async run() {
    if (await cmdExists("lazygit")) {
      await this.info("lazygit already installed; skipping");
      return;
    }

    // 1) Try distro package (Ubuntu 25.10+/Debian 13+)
    try {
      await this.aptUpdate();
      await this.aptInstall("lazygit");
      return;
    } catch {
      // fall through
    }

    // 2) Upstream tarball from latest. Prefer versioned URL via redirect.
    const arch = Deno.build.arch === "x86_64" ? "x86_64"
              : Deno.build.arch === "aarch64" ? "arm64"
              : "";
    if (!arch) throw new Error(`unsupported arch ${Deno.build.arch}`);
    const eff = await ghLatestRedirect("jesseduffield/lazygit");
    const tag = eff.split("/").pop() ?? ""; // e.g., v0.54.2
    const version = tag.replace(/^v/, "");
    const verUrl = version
      ? `https://github.com/jesseduffield/lazygit/releases/download/${tag}/lazygit_${version}_linux_${arch}.tar.gz`
      : "";
    const latestUrl = `https://github.com/jesseduffield/lazygit/releases/latest/download/lazygit_linux_${arch}.tar.gz`;
    try {
      await this.info(`lazygit arch=${Deno.build.arch} mapped=${arch} tag=${tag}`);
      if (verUrl) await this.info(`trying url: ${verUrl}`);
      if (verUrl) {
        await installTarballBinary({ url: verUrl, binName: "lazygit" });
        return;
      }
      throw new Error("no versioned url");
    } catch {
      // Fallback if the versioned asset is missing for this arch
      await this.info(`fallback url: ${latestUrl}`);
      await installTarballBinary({ url: latestUrl, binName: "lazygit" });
    }
  }

  override async post() {
    if (!(await cmdExists("lazygit"))) throw new Error("verify: lazygit missing on PATH");
  }
}
