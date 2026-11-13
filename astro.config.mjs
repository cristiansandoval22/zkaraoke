import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import { cacheNetlify } from '@astrojs/netlify/cache';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  cache: {
    provider: cacheNetlify(),
  },
})
