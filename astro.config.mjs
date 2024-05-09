import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://www.timjs.ro",
  integrations: [tailwind(), mdx(), sitemap()],
  trailingSlash: "always",
});
