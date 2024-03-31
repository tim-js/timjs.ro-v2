import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  site: "https://timjs.netlify.app",
  integrations: [tailwind(), mdx(), sitemap(), svelte()],
  redirects: { "/": "/home" },
});
