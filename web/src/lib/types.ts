/**
 * Typen der Daten, wie sie die GROQ-Abfragen in queries.ts liefern.
 */
import type { LocaleId } from '../../../site.config'
import type { RoutableType } from '../../../shared/routing'

export type { LocaleId }

export interface SanityImage {
  _type?: string
  asset?: {
    _ref?: string
    _id?: string
    url?: string
    metadata?: {
      dimensions?: { width: number; height: number; aspectRatio: number }
      lqip?: string
      hasAlpha?: boolean
      isOpaque?: boolean
    }
  }
  crop?: { top: number; bottom: number; left: number; right: number }
  hotspot?: { x: number; y: number; height: number; width: number }
  alt?: string
  caption?: string
  credit?: string
}

/** Aufgelöstes Linkziel (interne Referenz) */
export interface LinkRef {
  _type: RoutableType
  language?: LocaleId
  slug?: string
  title?: string
  shortDefinition?: string
}

export interface LinkTarget {
  label: string
  internal?: LinkRef | null
  external?: string
}

/** Portable Text – bewusst locker typisiert, Blöcke werden von Komponenten geprüft */
export type PortableTextValue = Array<{ _type: string; _key: string; [key: string]: unknown }>

export interface FaqItem {
  _key: string
  question: string
  answer: PortableTextValue
}

export interface Seo {
  focusKeyword?: string
  metaTitle?: string
  metaDescription?: string
  canonical?: string
  noIndex?: boolean
  noFollow?: boolean
  ogTitle?: string
  ogDescription?: string
  ogImage?: SanityImage
  sitemapPriority?: number
  sitemapChangefreq?: string
}

export interface Localized<T = string> {
  de?: T
  en?: T
}

export interface Category {
  _id: string
  title: Localized
  slug: Localized<{ current: string }>
  description?: Localized
  body?: Localized<PortableTextValue>
  order?: number
  noIndex?: boolean
}

export interface Source {
  _key: string
  title: string
  url: string
  publisher?: string
  date?: string
}

export interface Author {
  _id: string
  name: string
  slug: string
  image?: SanityImage
  jobTitle?: Localized
  bio?: Localized
  expertise?: string[]
  links?: { label: string; url: string }[]
}

export interface Translation {
  language: LocaleId
  slug: string
  _type: RoutableType
}

interface BaseDoc {
  _id: string
  _type: RoutableType
  _updatedAt: string
  language: LocaleId
  title: string
  slug: string
  seo?: Seo
  faq?: FaqItem[]
  translations?: Translation[]
}

/** Gemeinsame Felder von Artikel, Vergleich, Review */
export interface EditorialDoc extends BaseDoc {
  _type: 'article' | 'comparison' | 'review'
  excerpt: string
  mainImage?: SanityImage
  authors: Author[]
  category?: Category
  publishedAt: string
  updatedAt?: string
  body?: PortableTextValue
  related?: CardItem[]
  keyTakeaways?: string[]
  sources?: Source[]
  reviewedBy?: Author
  /** Im Text erwähnte Glossarbegriffe (Schlüssel "lang:slug"), beim Laden berechnet */
  mentions?: string[]
}

export interface ComparisonItem {
  _key: string
  name: string
  badge?: string
  image?: SanityImage
  summary: string
  pros?: string[]
  cons?: string[]
  rating?: number
  url?: string
  bestFor?: string
  priceFrom?: number
  review?: LinkRef | null
}

export interface TableData {
  caption?: string
  headerRow?: boolean
  headerColumn?: boolean
  rows: { _key: string; cells: string[] }[]
}

export interface Article extends EditorialDoc {
  _type: 'article'
}

export interface Comparison extends EditorialDoc {
  _type: 'comparison'
  intro?: PortableTextValue
  items: ComparisonItem[]
  comparisonTable?: TableData
}

export interface Review extends EditorialDoc {
  _type: 'review'
  product: {
    name: string
    brand: string
    image?: SanityImage
    url?: string
    priceFrom?: number
    freePlan?: string
    productType?: 'software' | 'product'
    applicationCategory?: string
    operatingSystem?: string
  }
  rating: number
  pros: string[]
  cons: string[]
  verdict: string
}

export interface GlossaryTerm extends BaseDoc {
  _type: 'glossaryTerm'
  shortDefinition: string
  alternateNames?: string[]
  sameAs?: string[]
  category?: Category
  body?: PortableTextValue
  relatedTerms?: LinkRef[]
  updatedAt?: string
  mentions?: string[]
}

export type LandingSection =
  | { _type: 'heroSection'; _key: string; eyebrow?: string; title: string; text?: string; image?: SanityImage; link?: LinkTarget }
  | { _type: 'textSection'; _key: string; title?: string; body: PortableTextValue }
  | { _type: 'benefitsSection'; _key: string; title: string; intro?: string; items: { _key: string; title: string; text?: string }[] }
  | { _type: 'ctaSection'; _key: string; title: string; text?: string; link: LinkTarget }
  | { _type: 'faqSection'; _key: string; title?: string; items: FaqItem[] }

export interface LandingPage extends BaseDoc {
  _type: 'landingPage'
  sections: LandingSection[]
}

export type PageType = 'generic' | 'about' | 'contact' | 'editorialPolicy' | 'imprint' | 'privacy'

export interface Page extends BaseDoc {
  _type: 'page'
  pageType?: PageType
  intro?: string
  body: PortableTextValue
  updatedAt?: string
}

export type ContentDoc = Article | Comparison | Review | GlossaryTerm | LandingPage | Page

/** Kompakte Darstellung für Karten und Listen */
export interface CardItem {
  _id: string
  _type: RoutableType
  language: LocaleId
  title: string
  slug: string
  excerpt?: string
  mainImage?: SanityImage
  publishedAt?: string
  category?: Category
  rating?: number
}

export interface SiteSettings {
  siteName: string
  tagline?: Localized
  homeIntro?: Localized
  logo?: SanityImage
  favicon?: SanityImage
  defaultOgImage?: SanityImage
  mainNav?: Localized<LinkTarget[]>
  showCategoriesInNav?: boolean
  footerText?: Localized
  footerNav?: Localized<LinkTarget[]>
  legalPages?: Localized<{
    imprint?: LinkRef
    privacy?: LinkRef
    editorialPolicy?: LinkRef
    contact?: LinkRef
  }>
  organization?: {
    legalName?: string
    description?: Localized
    knowsAbout?: string[]
    foundingDate?: string
    email?: string
    streetAddress?: string
    postalCode?: string
    city?: string
    country?: string
  }
  adsense?: {
    enabled?: boolean
    clientId?: string
    placements?: { articleTop?: string; articleMiddle?: string; articleBottom?: string; listing?: string }
  }
}
