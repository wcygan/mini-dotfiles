// Shared source of truth for dotfile symlink mappings
// Builds absolute src/dst pairs based on current repo + HOME
import { join } from "jsr:@std/path";

export type FileMapping = { src: string; dst: string };

export function getFileMappings(): FileMapping[] {
  const home = Deno.env.get("HOME");
  if (!home) throw new Error("HOME not set");
  const repo = Deno.cwd();
  const configDir = Deno.env.get("XDG_CONFIG_HOME") ?? join(home, ".config");

  const mappings: FileMapping[] = [
    { src: join(repo, "dotfiles", "bashrc"), dst: join(home, ".bashrc") },
    {
      src: join(repo, "dotfiles", "bash_profile"),
      dst: join(home, ".bash_profile"),
    },
    { src: join(repo, "dotfiles", "zshrc"), dst: join(home, ".zshrc") },
    {
      src: join(repo, "dotfiles", "fish", "config.fish"),
      dst: join(configDir, "fish", "config.fish"),
    },
    { src: join(repo, "dotfiles", "gitconfig"), dst: join(home, ".gitconfig") },
    { src: join(repo, "dotfiles", "tmux.conf"), dst: join(home, ".tmux.conf") },
    {
      src: join(repo, "dotfiles", "aliases.sh"),
      dst: join(home, ".aliases.sh"),
    },
    {
      src: join(repo, "dotfiles", "starship.toml"),
      dst: join(configDir, "starship.toml"),
    },
    {
      src: join(repo, "dotfiles", "ghostty", "config"),
      dst: join(configDir, "ghostty", "config"),
    },
    {
      src: join(repo, "dotfiles", "zed", "settings.json"),
      dst: join(configDir, "zed", "settings.json"),
    },
    {
      src: join(repo, "dotfiles", "zed", "keymap.json"),
      dst: join(configDir, "zed", "keymap.json"),
    },
  ];

  // On macOS, Ghostty also reads configuration from the Application Support path.
  // Keep both targets in sync so Ghostty finds the config regardless of which
  // discovery mechanism is used.
  if (Deno.build.os === "darwin") {
    mappings.push({
      src: join(repo, "dotfiles", "ghostty", "config"),
      dst: join(home, "Library", "Application Support", "Ghostty", "config"),
    });
    // Legacy bundle identifier used by Ghostty: com.mitchellh.ghostty
    mappings.push({
      src: join(repo, "dotfiles", "ghostty", "config"),
      dst: join(
        home,
        "Library",
        "Application Support",
        "com.mitchellh.ghostty",
        "config",
      ),
    });
  }

  return mappings;
}
