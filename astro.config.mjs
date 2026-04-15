import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://www.timjs.ro",
  integrations: [mdx(), sitemap(), icon()],
  vite: {
    plugins: [tailwindcss()],
  },
  redirects: {
    "/meetup-feedback/": {
      status: 302,
      destination: "https://tally.so/r/ODJp0K",
    },
    "/discord/": {
      status: 302,
      destination: "https://discord.com/invite/fTYxvBeBHr",
    },
    "/screen-share/": {
      status: 302,
      destination: "https://vdo.ninja/?push=pGVyxYW&quality=0&label=TimJsMeetupSharing",
    },
  },
});
