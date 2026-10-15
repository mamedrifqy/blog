import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [react(), mdx()],
  output: 'static',
  markdown: {
    // GFM footnotes ([^id]) render as a numbered list at the bottom of each post.
    remarkRehype: {
      footnoteLabel: 'Notes and references',
      footnoteLabelProperties: { className: ['footnotes-heading'] },
      footnoteBackLabel: 'Back to text',
    },
  },
  site: 'https://mamedrifqy.github.io',
  base: '/blog',
});
