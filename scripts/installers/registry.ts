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

import { JqUbuntuInstaller } from "./ubuntu/jq.ts";
import { BatUbuntuInstaller } from "./ubuntu/bat.ts";
import { FdUbuntuInstaller } from "./ubuntu/fd.ts";
import { NeovimUbuntuInstaller } from "./ubuntu/neovim.ts";

import { JqFedoraInstaller } from "./fedora/jq.ts";
import { BatFedoraInstaller } from "./fedora/bat.ts";
import { FdFedoraInstaller } from "./fedora/fd.ts";
import { NeovimFedoraInstaller } from "./fedora/neovim.ts";

import { JqMacInstaller } from "./mac/jq.ts";
import { BatMacInstaller } from "./mac/bat.ts";
import { FdMacInstaller } from "./mac/fd.ts";
import { NeovimMacInstaller } from "./mac/neovim.ts";
import { FishUbuntuInstaller } from "./ubuntu/fish.ts";
import { FishFedoraInstaller } from "./fedora/fish.ts";
import { FishMacInstaller } from "./mac/fish.ts";

export function installersFor(os: OS) {
  switch (os) {
    case "ubuntu":
      return [
        new JqUbuntuInstaller(),
        new BatUbuntuInstaller(),
        new FdUbuntuInstaller(),
        new NeovimUbuntuInstaller(),
        new FishUbuntuInstaller(),
        new FzfUbuntuInstaller(),
        new StarshipUbuntuInstaller(),
        new LazyGitUbuntuInstaller(),
      ];
    case "fedora":
      return [
        new JqFedoraInstaller(),
        new BatFedoraInstaller(),
        new FdFedoraInstaller(),
        new NeovimFedoraInstaller(),
        new FishFedoraInstaller(),
        new FzfFedoraInstaller(),
        new StarshipFedoraInstaller(),
        new LazyGitFedoraInstaller(),
      ];
    case "mac":
      return [
        new JqMacInstaller(),
        new BatMacInstaller(),
        new FdMacInstaller(),
        new NeovimMacInstaller(),
        new FishMacInstaller(),
        new FzfMacInstaller(),
        new StarshipMacInstaller(),
        new LazyGitMacInstaller(),
      ];
  }
}
