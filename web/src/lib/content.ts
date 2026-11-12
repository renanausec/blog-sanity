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
import { siteConfig } from '../../../site.config'

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

  return {
    settings: settings ?? { siteName: siteConfig.name },
    categories,
    authors,
    articles: clean(articles),
    comparisons: clean(comparisons),
    reviews: clean(reviews),
    glossary: glossary.map((g) => ({ ...g, relatedTerms: (g.relatedTerms ?? []).filter(Boolean) })),
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
