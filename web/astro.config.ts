import { defineConfig } from 'astro/config'
import sanity from '@sanity/astro'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { siteConfig } from '../site.config'
import { resolveSiteUrl } from '../shared/routing'

// Lokale Umgebungsvariablen aus der .env im Projektstamm laden (in Cloudflare kommen sie aus den Settings)
const rootEnv = fileURLToPath(new URL('../.env', import.meta.url))
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv)

const site = resolveSiteUrl(process.env.SITE_URL)
// Theme aus site.config.ts; SITE_THEME überschreibt es (z. B. zum Testen eines anderen Themes)
const theme = process.env.SITE_THEME ?? siteConfig.theme

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // CSS inline: kleines Gesamtvolumen, dafür kein render-blockierender Request
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  prefetch: false,
  integrations: [
    sanity({
      projectId: siteConfig.sanity.projectId,
      dataset: siteConfig.sanity.dataset,
      apiVersion: siteConfig.sanity.apiVersion,
      // Statischer Build: immer frische Daten direkt aus der API.
      // Der Lese-Token wird NICHT hier gesetzt (sonst landet er im Client-Bundle),
      // sondern pro Anfrage in src/lib/sanity.ts.
      useCdn: false,
    }),
  ],
  image: {
    // Bilder aus Sanity werden beim Build heruntergeladen und unter /_astro/ ausgeliefert.
    domains: ['cdn.sanity.io'],
  },
  vite: {
    resolve: {
      alias: {
        // Aktives Theme – Umschalten in site.config.ts → theme
        '@theme': fileURLToPath(new URL(`./src/themes/${theme}`, import.meta.url)),
      },
    },
  },
})
