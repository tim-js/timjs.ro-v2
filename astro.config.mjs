import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://www.timjs.ro",
  integrations: [tailwind(), mdx(), sitemap(), icon()],
  trailingSlash: "always",
  redirects: {
    "/meetup-feedback/": {
      status: 302,
      destination: "https://tally.so/r/mOqlE8",
    },
    "/discord/": {
      status: 302,
      destination: "https://discord.com/invite/fTYxvBeBHr",
    },
  },
});
