import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://www.zoomphant.com',
  output: 'static',
  server: {
    port: 1080,
    host: true,
    allowedHosts: [
      'www.zoomphant.cn',
      'zoomphant.cn',
      'www.zoomphant.com',
      'zoomphant.com',
      '.zoomphant.cn',
      '.zoomphant.com',
    ],
  },
  integrations: [
    tailwind(),
    mdx(),
  ],
});
