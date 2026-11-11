import { defineConfig } from 'astro/config'

import vercel from '@astrojs/vercel';
import { cacheVercel } from '@astrojs/vercel/cache';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  cache: {
    provider: cacheVercel(),
  },
})
