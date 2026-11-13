import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import { cacheNetlify } from '@astrojs/netlify/cache';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    // Este proyecto no define Edge Functions propias.
    // Evita que Astro intente iniciar el servidor local de Deno al desarrollar.
    devFeatures: {
      edgeFunctions: false,
    },
  }),
  cache: {
    provider: cacheNetlify(),
  },
})
