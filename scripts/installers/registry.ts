import { OS } from "./core/types.ts";
import { FzfUbuntuInstaller } from "./ubuntu/fzf.ts";
import { FzfFedoraInstaller } from "./fedora/fzf.ts";
import { FzfMacInstaller } from "./mac/fzf.ts";
import { StarshipUbuntuInstaller } from "./ubuntu/starship.ts";
import { StarshipFedoraInstaller } from "./fedora/starship.ts";
import { StarshipMacInstaller } from "./mac/starship.ts";
import { LazyGitUbuntuInstaller } from "./ubuntu/lazygit.ts";
import { LazyGitFedoraInstaller } from "./fedora/lazygit.ts";
import { LazyGitMacInstaller } from "./mac/lazygit.ts";

export function installersFor(os: OS) {
  switch (os) {
    case "ubuntu":
      return [
        new FzfUbuntuInstaller(),
        new StarshipUbuntuInstaller(),
        new LazyGitUbuntuInstaller(),
      ];
    case "fedora":
      return [
        new FzfFedoraInstaller(),
        new StarshipFedoraInstaller(),
        new LazyGitFedoraInstaller(),
      ];
    case "mac":
      return [
        new FzfMacInstaller(),
        new StarshipMacInstaller(),
        new LazyGitMacInstaller(),
      ];
  }
}

