/**
 * Zentrale Routentabelle: jede erzeugte HTML-Seite genau einmal.
 * Daraus entstehen Seiten ([...path].astro), Sitemaps, hreflang und llms.txt.
 *
 * hreflang: Jede Route nennt Kandidaten-Pfade ihrer Sprachversionen. Übernommen werden nur
 * Kandidaten, die tatsächlich als indexierbare Route existieren → immer wechselseitig.
 */
import { defaultLocale, localeIds, siteConfig, type LocaleId } from '../../../site.config'
import { docPath, paginatedPath } from '../../../shared/routing'
import { editorialFor, loadContent, toCard, type Content } from './content'
import { pick } from './i18n'
import type {
  Author,
  CardItem,
  Category,
  ContentDoc,
  EditorialDoc,
  GlossaryTerm,
} from './types'

export interface ListData {
  items: CardItem[]
  page: number
  totalPages: number
  /** Pfad von Seite 1 (für Paginierung) */
  basePath: string
}

export type RouteData =
  | { kind: 'home'; list: ListData }
  | { kind: 'category'; category: Category; list: ListData }
  | { kind: 'author'; author: Author; list: ListData }
  | { kind: 'glossaryIndex'; terms: GlossaryTerm[] }
  | { kind: 'doc'; doc: ContentDoc }

export interface Route {
  path: string
  lang: LocaleId
  data: RouteData
  noIndex: boolean
  /** Kandidaten für hreflang (inkl. eigener Pfad) */
  candidates: Partial<Record<LocaleId, string>>
  /** Endgültige Sprachversionen (nach Abgleich), inkl. eigener Sprache */
  alternates: Partial<Record<LocaleId, string>>
  lastmod?: string
  sitemap?: { priority: number; changefreq: string }
}

const defaults: Record<string, { priority: number; changefreq: string }> = {
  home: { priority: 1, changefreq: 'daily' },
  article: { priority: 0.8, changefreq: 'weekly' },
  comparison: { priority: 0.8, changefreq: 'monthly' },
  review: { priority: 0.8, changefreq: 'monthly' },
  glossaryIndex: { priority: 0.6, changefreq: 'weekly' },
  glossaryTerm: { priority: 0.6, changefreq: 'monthly' },
  category: { priority: 0.6, changefreq: 'daily' },
  author: { priority: 0.4, changefreq: 'monthly' },
  landingPage: { priority: 0.7, changefreq: 'monthly' },
  page: { priority: 0.3, changefreq: 'yearly' },
}

function paginate(items: CardItem[], basePath: string, lang: LocaleId): { path: string; list: ListData }[] {
  const size = siteConfig.pageSize
  const totalPages = Math.max(1, Math.ceil(items.length / size))
  return Array.from({ length: totalPages }, (_, i) => ({
    path: paginatedPath(basePath, lang, i + 1),
    list: { items: items.slice(i * size, (i + 1) * size), page: i + 1, totalPages, basePath },
  }))
}

function latest(...dates: (string | undefined)[]): string | undefined {
  return dates.filter(Boolean).sort().at(-1)
}

let cache: Promise<Route[]> | undefined

export function getRoutes(): Promise<Route[]> {
  cache ??= loadContent().then(buildRoutes)
  return cache
}

function buildRoutes(content: Content): Route[] {
  const routes: Route[] = []

  for (const lang of localeIds) {
    const editorial = editorialFor(content, lang)
    const cards = editorial.map(toCard)

    // Startseite + Paginierung
    for (const { path, list } of paginate(cards, docPath('home', lang), lang)) {
      routes.push({
        path,
        lang,
        data: { kind: 'home', list },
        noIndex: false,
        candidates: Object.fromEntries(localeIds.map((l) => [l, paginatedPath(docPath('home', l), l, list.page)])),
        alternates: {},
        lastmod: list.page === 1 ? cards[0]?.publishedAt : undefined,
        sitemap: list.page === 1 ? defaults.home : undefined,
      })
    }

    // Kategorien
    for (const category of content.categories) {
      const slug = pick(category.slug, lang)?.current
      if (!slug) continue
      const items = cards.filter((c) => c.category?._id === category._id)
      const basePath = docPath('category', lang, slug)
      for (const { path, list } of paginate(items, basePath, lang)) {
        routes.push({
          path,
          lang,
          data: { kind: 'category', category, list },
          noIndex: !!category.noIndex || items.length === 0,
          candidates: Object.fromEntries(
            localeIds.map((l) => {
              const s = pick(category.slug, l)?.current
              return [l, s ? paginatedPath(docPath('category', l, s), l, list.page) : undefined]
            }),
          ),
          alternates: {},
          lastmod: list.page === 1 ? items[0]?.publishedAt : undefined,
          sitemap: list.page === 1 ? defaults.category : undefined,
        })
      }
    }

    // Autoren
    for (const author of content.authors) {
      const items = editorial.filter((d) => d.authors.some((a) => a._id === author._id)).map(toCard)
      const basePath = docPath('author', lang, author.slug)
      for (const { path, list } of paginate(items, basePath, lang)) {
        routes.push({
          path,
          lang,
          data: { kind: 'author', author, list },
          noIndex: items.length === 0,
          candidates: Object.fromEntries(
            localeIds.map((l) => [l, paginatedPath(docPath('author', l, author.slug), l, list.page)]),
          ),
          alternates: {},
          lastmod: list.page === 1 ? items[0]?.publishedAt : undefined,
          sitemap: list.page === 1 ? defaults.author : undefined,
        })
      }
    }

    // Glossar-Index
    const terms = content.glossary.filter((g) => g.language === lang && !g.seo?.noIndex)
    routes.push({
      path: docPath('glossaryIndex', lang),
      lang,
      data: { kind: 'glossaryIndex', terms },
      noIndex: terms.length === 0,
      candidates: Object.fromEntries(localeIds.map((l) => [l, docPath('glossaryIndex', l)])),
      alternates: {},
      lastmod: latest(...terms.map((g) => g.updatedAt ?? g._updatedAt)),
      sitemap: defaults.glossaryIndex,
    })
  }

  // Einzeldokumente (alle Sprachen)
  const docs: ContentDoc[] = [
    ...content.articles,
    ...content.comparisons,
    ...content.reviews,
    ...content.glossary,
    ...content.landingPages,
    ...content.pages,
  ]
  for (const doc of docs) {
    const path = docPath(doc._type, doc.language, doc.slug)
    const candidates: Partial<Record<LocaleId, string>> = { [doc.language]: path }
    for (const tr of doc.translations ?? []) {
      if (tr.language !== doc.language) candidates[tr.language] = docPath(tr._type, tr.language, tr.slug)
    }
    const e = doc as EditorialDoc & { updatedAt?: string }
    routes.push({
      path,
      lang: doc.language,
      data: { kind: 'doc', doc },
      noIndex: !!doc.seo?.noIndex,
      candidates,
      alternates: {},
      lastmod: latest(e.updatedAt, e.publishedAt) ?? doc._updatedAt,
      sitemap: {
        priority: doc.seo?.sitemapPriority ?? defaults[doc._type].priority,
        changefreq: doc.seo?.sitemapChangefreq ?? defaults[doc._type].changefreq,
      },
    })
  }

  // Doppelte Pfade wären ein Datenfehler (z. B. gleicher Slug bei Artikel und Seite)
  const byPath = new Map<string, Route>()
  for (const r of routes) {
    if (byPath.has(r.path)) throw new Error(`Doppelter Pfad: ${r.path}`)
    byPath.set(r.path, r)
  }

  // hreflang: nur existierende, indexierbare Kandidaten
  for (const r of routes) {
    if (r.noIndex) continue
    for (const [l, p] of Object.entries(r.candidates) as [LocaleId, string | undefined][]) {
      const target = p ? byPath.get(p) : undefined
      if (target && !target.noIndex && target.lang === l) r.alternates[l] = p
    }
  }

  return routes
}

/** Ziel für hreflang="x-default": Version der Hauptsprache */
export function xDefault(route: Route): string | undefined {
  return route.alternates[defaultLocale]
}
