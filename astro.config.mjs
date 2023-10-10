import { defineConfig } from 'astro/config';
import solidJs from "@astrojs/solid-js";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  integrations: [solidJs(), mdx(), tailwind()],
  output: "static",
  // adapter: cloudflare()
});