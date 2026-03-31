import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [react(), mdx()],
  output: 'static',
  // If deploying to GitHub Pages, set your repo name:
  // base: '/riau-gis-blog',
});
