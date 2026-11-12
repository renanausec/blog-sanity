/**
 * URL-Logik, gemeinsam genutzt von Studio (Vorschau-Links, Slug-Prüfung) und Frontend.
 * Hauptsprache ohne Präfix (/…), weitere Sprachen mit Präfix (/en/…).
 * Alle Pfade enden mit "/".
 */
import { defaultLocale, siteConfig, type LocaleId } from '../site.config'

export type RoutableType =
  | 'home'
  | 'article'
  | 'landingPage'
  | 'page'
  | 'glossaryIndex'
  | 'glossaryTerm'
  | 'comparison'
  | 'review'
  | 'author'
  | 'category'

const r = siteConfig.routes

/** Dokumenttypen, die sich den Slug-Raum direkt unter der Sprachwurzel teilen */
export const rootSlugTypes = ['article', 'landingPage', 'page'] as const

export function localePrefix(lang: LocaleId): string {
  return lang === defaultLocale ? '' : `/${lang}`
}

export function docPath(type: RoutableType, lang: LocaleId, slug?: string): string {
  const p = localePrefix(lang)
  switch (type) {
    case 'home':
      return `${p}/`
    case 'article':
    case 'landingPage':
    case 'page':
      return `${p}/${slug}/`
    case 'glossaryIndex':
      return `${p}/${r.glossary[lang]}/`
    case 'glossaryTerm':
      return `${p}/${r.glossary[lang]}/${slug}/`
    case 'comparison':
      return `${p}/${r.comparison[lang]}/${slug}/`
    case 'review':
      return `${p}/${r.review[lang]}/${slug}/`
    case 'author':
      return `${p}/${r.author[lang]}/${slug}/`
    case 'category':
      return `${p}/${r.category[lang]}/${slug}/`
  }
}

/** Seite n einer Liste: /kategorie/crm/ → /kategorie/crm/seite/2/ */
export function paginatedPath(basePath: string, lang: LocaleId, page: number): string {
  return page <= 1 ? basePath : `${basePath}${r.pagination[lang]}/${page}/`
}

/** Slugs, die unter der Sprachwurzel nicht vergeben werden dürfen (Kollision mit festen Routen) */
export function reservedRootSlugs(lang: LocaleId): string[] {
  const segments = Object.values(r).map((byLang) => byLang[lang])
  const locales = siteConfig.locales.map((l) => l.id)
  return [...segments, ...locales, '404', '_astro', 'fonts', 'rss', 'sitemap', 'llms']
}

/** Absolute URL zu einem Pfad */
export function absoluteUrl(path: string, base: string = siteConfig.url): string {
  return new URL(path, base.endsWith('/') ? base : `${base}/`).toString()
}
