/**
 * Lädt alle veröffentlichten Inhalte einmal pro Build (Promise-Cache).
 * Alle Seiten, Feeds, Sitemaps und llms.txt arbeiten mit diesem Datenstand.
 */
import { client } from './sanity'
import { queries } from './queries'
import type {
  Article,
  Author,
  CardItem,
  Category,
  Comparison,
  EditorialDoc,
  GlossaryTerm,
  LandingPage,
  LocaleId,
  Page,
  Review,
  SiteSettings,
} from './types'
import { localeIds, siteConfig } from '../../../site.config'
import { autoLinkGlossary, buildPatterns, termKey } from './glossaryLinks'

export interface Content {
  settings: SiteSettings
  categories: Category[]
  authors: Author[]
  articles: Article[]
  comparisons: Comparison[]
  reviews: Review[]
  glossary: GlossaryTerm[]
  landingPages: LandingPage[]
  pages: Page[]
}

let cache: Promise<Content> | undefined

export function loadContent(): Promise<Content> {
  cache ??= fetchAll()
  return cache
}

/** GROQ liefert für fehlende Felder `null` – wir entfernen sie, damit Standardwerte greifen */
function stripNulls<T>(value: T): T {
  if (Array.isArray(value)) return value.filter((v) => v !== null).map(stripNulls) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).filter(([, v]) => v !== null).map(([k, v]) => [k, stripNulls(v)]),
    ) as T
  }
  return value
}

async function fetchAll(): Promise<Content> {
  const fetch = async <T>(query: string) => stripNulls(await client.fetch<T>(query))
  const [settings, categories, authors, articles, comparisons, reviews, glossary, landingPages, pages] =
    await Promise.all([
      fetch<SiteSettings | null>(queries.settings),
      fetch<Category[]>(queries.categories),
      fetch<Author[]>(queries.authors),
      fetch<Article[]>(queries.articles),
      fetch<Comparison[]>(queries.comparisons),
      fetch<Review[]>(queries.reviews),
      fetch<GlossaryTerm[]>(queries.glossary),
      fetch<LandingPage[]>(queries.landingPages),
      fetch<Page[]>(queries.pages),
    ])

  // Nicht veröffentlichte Referenzen (null) aus Listen entfernen
  const clean = <T extends EditorialDoc>(docs: T[]) =>
    docs.map((d) => ({
      ...d,
      authors: (d.authors ?? []).filter(Boolean),
      related: (d.related ?? []).filter(Boolean),
    }))

  // Automatische Glossar-Verlinkung (einmal pro Build)
  const patterns = Object.fromEntries(localeIds.map((l) => [l, buildPatterns(glossary, l)]))
  const linkEditorial = <T extends EditorialDoc>(doc: T): T => {
    const linked = new Set<string>()
    const intro = (doc as unknown as Comparison).intro
    const next = { ...doc } as T & { intro?: Comparison['intro'] }
    if (intro) next.intro = autoLinkGlossary(intro, patterns[doc.language], linked)
    next.body = autoLinkGlossary(doc.body, patterns[doc.language], linked)
    next.mentions = [...linked]
    return next
  }
  const linkTerm = (term: GlossaryTerm): GlossaryTerm => {
    const linked = new Set<string>()
    const self = termKey(term.language, term.slug)
    const body = autoLinkGlossary(term.body, patterns[term.language], linked, { exclude: self, max: 6 })
    return { ...term, body, relatedTerms: (term.relatedTerms ?? []).filter(Boolean), mentions: [...linked].filter((k) => k !== self) }
  }
  const linkCategory = (category: Category): Category => ({
    ...category,
    body: Object.fromEntries(
      localeIds.map((l) => [l, autoLinkGlossary(category.body?.[l], patterns[l], new Set(), { max: 8 })]),
    ),
  })

  return {
    settings: settings ?? { siteName: siteConfig.name },
    categories: categories.map(linkCategory),
    authors,
    articles: clean(articles).map(linkEditorial),
    comparisons: clean(comparisons).map(linkEditorial),
    reviews: clean(reviews).map(linkEditorial),
    glossary: glossary.map(linkTerm),
    landingPages,
    pages,
  }
}

/** Alle redaktionellen Inhalte (Artikel, Vergleiche, Reviews) einer Sprache, neueste zuerst */
export function editorialFor(content: Content, lang: LocaleId): EditorialDoc[] {
  return [...content.articles, ...content.comparisons, ...content.reviews]
    .filter((d) => d.language === lang && !d.seo?.noIndex)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export function toCard(doc: EditorialDoc): CardItem {
  return {
    _id: doc._id,
    _type: doc._type,
    language: doc.language,
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt,
    mainImage: doc.mainImage,
    publishedAt: doc.publishedAt,
    category: doc.category,
    rating: (doc as Review).rating,
  }
}

/**
 * Verwandte Inhalte: manuell gepflegte zuerst, aufgefüllt mit Inhalten,
 * die dieselben Glossarbegriffe erwähnen bzw. derselben Kategorie angehören.
 */
export function relatedFor(content: Content, doc: EditorialDoc, count = 3): CardItem[] {
  const manual = doc.related ?? []
  if (manual.length >= count) return manual
  const taken = new Set([doc._id, ...manual.map((r) => r._id)])
  const mentions = new Set(doc.mentions ?? [])
  const scored = editorialFor(content, doc.language)
    .filter((d) => !taken.has(d._id))
    .map((d) => ({
      d,
      score:
        (d.category?._id && d.category._id === doc.category?._id ? 2 : 0) +
        (d.mentions ?? []).filter((m) => mentions.has(m)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.d.publishedAt.localeCompare(a.d.publishedAt))
  return [...manual, ...scored.slice(0, count - manual.length).map((x) => toCard(x.d))]
}

/** Redaktionelle Inhalte, die einen Glossarbegriff erwähnen (für „Erwähnt in“) */
export function mentionedIn(content: Content, term: GlossaryTerm, limit = 8): CardItem[] {
  const key = `${term.language}:${term.slug}`
  return editorialFor(content, term.language)
    .filter((d) => d.mentions?.includes(key))
    .slice(0, limit)
    .map(toCard)
}
