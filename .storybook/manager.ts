import { addons } from "@storybook/manager-api";
import { valetDark } from "./valetTheme";

addons.setConfig({
  theme: valetDark,
  sidebar: {
    showRoots: true,
    collapsedRoots: [],
  },
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
});

