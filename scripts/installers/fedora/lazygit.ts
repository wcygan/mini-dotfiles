import $ from "jsr:@david/dax";
import { FedoraInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir } from "../core/utils.ts";
import { log } from "../../log.ts";
import { join } from "jsr:@std/path";

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

    const os = Deno.build.os; // linux here
    const arch = Deno.build.arch; // x86_64 | aarch64
    const assetOS = os === "linux" ? "Linux" : "";
    const assetArch = arch === "x86_64" ? "x86_64" : arch === "aarch64" ? "arm64" : "";
    if (!assetOS || !assetArch) throw new Error(`unsupported platform ${os}/${arch}`);
    // Avoid GitHub API rate limits by using the versionless latest/download URL
    const assetName = `lazygit_${assetOS}_${assetArch}.tar.gz`;
    const url = `https://github.com/jesseduffield/lazygit/releases/latest/download/${assetName}`;

    const tmpDir = await Deno.makeTempDir();
    const tarPath = join(tmpDir, assetName);
    await $`curl -fsSL -o ${tarPath} ${url}`;
    await $`tar -xzf ${tarPath} -C ${tmpDir}`;
    const binSrc = join(tmpDir, "lazygit");
    await Deno.chmod(binSrc, 0o755).catch(() => {});

    const dst = join(binDir(), "lazygit");
    try { await Deno.remove(dst); } catch {}
    await Deno.rename(binSrc, dst);
  }

  override async post() {
    if (!(await cmdExists("lazygit"))) throw new Error("lazygit not found after install");
  }
}
