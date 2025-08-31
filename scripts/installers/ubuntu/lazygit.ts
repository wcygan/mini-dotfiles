import $ from "jsr:@david/dax";
import { UbuntuInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir, homeDir } from "../core/utils.ts";
import { log } from "../../log.ts";
import { join } from "jsr:@std/path";

export class LazyGitUbuntuInstaller extends UbuntuInstaller {
  readonly name = "lazygit-ubuntu";

  async pre() { await ensureDir(binDir()); }

  async run() {
    if (await cmdExists("lazygit")) {
      await log.info("install-software", "lazygit already installed; skipping");
      return;
    }

    // Try apt, then fall back to GitHub release
    try {
      await this.aptUpdate();
      await this.aptInstall("lazygit");
      return;
    } catch {
      // fall through
    }

    const os = Deno.build.os; // linux here
    const arch = Deno.build.arch; // x86_64 | aarch64
    const assetOS = os === "linux" ? "Linux" : "";
    const assetArch = arch === "x86_64" ? "x86_64" : arch === "aarch64" ? "arm64" : "";
    if (!assetOS || !assetArch) throw new Error(`unsupported platform ${os}/${arch}`);

    const latestRes = await fetch("https://api.github.com/repos/jesseduffield/lazygit/releases/latest", {
      headers: { "Accept": "application/vnd.github+json" },
    });
    if (!latestRes.ok) throw new Error(`failed to fetch latest release: ${latestRes.status}`);
    const latest = await latestRes.json();
    const tag = String(latest.tag_name ?? latest.tag ?? "");
    if (!tag) throw new Error("could not determine latest tag");
    const version = tag.replace(/^v/, "");
    const assetName = `lazygit_${version}_${assetOS}_${assetArch}.tar.gz`;
    const url = `https://github.com/jesseduffield/lazygit/releases/download/${tag}/${assetName}`;

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

  async post() {
    if (!(await cmdExists("lazygit"))) throw new Error("lazygit not found after install");
  }
}

