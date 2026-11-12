/**
 * Build-Umgebung: Ist dieser Build die indexierbare Produktivseite?
 *
 * Indexierbar nur, wenn
 *  - die Basis-URL der Domain aus site.config.ts entspricht (SITE_URL nicht auf eine Test-Domain gesetzt) und
 *  - Cloudflare nicht aus einem anderen Branch als "main" baut.
 * Sonst: noindex auf allen Seiten und "Disallow: /" in robots.txt.
 */
import { siteConfig } from '../../../site.config'
import { resolveSiteUrl } from '../../../shared/routing'

const branch = process.env.CF_PAGES_BRANCH
const siteUrl = resolveSiteUrl(process.env.SITE_URL)

export const isProductionBuild =
  new URL(siteUrl).host === new URL(siteConfig.url).host && (!branch || branch === 'main')
