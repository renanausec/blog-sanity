/**
 * Strukturierte Daten (schema.org, JSON-LD).
 * Alle Knoten einer Seite werden als @graph ausgegeben und über @id verknüpft:
 * Organization ← WebSite ← WebPage ← Article/Review/DefinedTerm …, Personen und Begriffe per @id.
 */
import { toPlainText } from 'astro-portabletext'
import { defaultLocale, siteConfig, type LocaleId } from '../../../site.config'
import { absoluteUrl, docPath, type RoutableType } from '../../../shared/routing'
import { localeInfo, pick, refHref } from './i18n'
import type {
  Author,
  Category,
  ComparisonItem,
  FaqItem,
  GlossaryTerm,
  PortableTextValue,
  Review,
  SiteSettings,
  Source,
  Translation,
} from './types'

type Node = Record<string, unknown>

export const ids = {
  organization: () => absoluteUrl('/#organization'),
  website: (lang: LocaleId) => `${absoluteUrl(docPath('home', lang))}#website`,
  webpage: (path: string) => `${absoluteUrl(path)}#webpage`,
  breadcrumb: (path: string) => `${absoluteUrl(path)}#breadcrumb`,
  article: (path: string) => `${absoluteUrl(path)}#article`,
  person: (author: Author) => `${absoluteUrl(docPath('author', defaultLocale, author.slug))}#person`,
  glossarySet: (lang: LocaleId) => `${absoluteUrl(docPath('glossaryIndex', lang))}#termset`,
  term: (lang: LocaleId, slug: string) => `${absoluteUrl(docPath('glossaryTerm', lang, slug))}#term`,
}

export function plain(value: PortableTextValue | undefined): string {
  return value?.length ? toPlainText(value as never).trim() : ''
}

/** Begriffsschlüssel "lang:slug" → DefinedTerm-Knoten (für mentions) */
export function mentionNodes(keys: string[] | undefined, glossary: GlossaryTerm[]): Node[] | undefined {
  const nodes = (keys ?? [])
    .map((k) => glossary.find((g) => `${g.language}:${g.slug}` === k))
    .filter((g): g is GlossaryTerm => !!g)
    .map((g) => ({
      '@type': 'DefinedTerm',
      '@id': ids.term(g.language, g.slug),
      name: g.title,
      url: absoluteUrl(docPath('glossaryTerm', g.language, g.slug)),
    }))
  return nodes.length ? nodes : undefined
}

export function organizationNode(settings: SiteSettings, lang: LocaleId, logoUrl?: string): Node {
  const org = settings.organization ?? {}
  const legal = settings.legalPages?.[lang] ?? {}
  const sameAs = Object.values(siteConfig.social).filter(Boolean)
  const policy = refHref(legal.editorialPolicy, lang)
  const contact = refHref(legal.contact, lang)
  return {
    '@type': 'Organization',
    '@id': ids.organization(),
    name: settings.siteName || siteConfig.name,
    legalName: org.legalName || undefined,
    description: pick(org.description, lang) ?? siteConfig.about[lang],
    url: absoluteUrl('/'),
    logo: logoUrl ? { '@type': 'ImageObject', url: logoUrl } : undefined,
    email: org.email || undefined,
    foundingDate: org.foundingDate,
    knowsAbout: org.knowsAbout?.length ? org.knowsAbout : undefined,
    publishingPrinciples: policy ? absoluteUrl(policy) : undefined,
    correctionsPolicy: policy ? absoluteUrl(policy) : undefined,
    contactPoint:
      org.email || contact
        ? {
            '@type': 'ContactPoint',
            contactType: 'editorial',
            email: org.email || undefined,
            url: contact ? absoluteUrl(contact) : undefined,
            availableLanguage: siteConfig.locales.map((l) => l.title),
          }
        : undefined,
    address: org.city
      ? {
          '@type': 'PostalAddress',
          streetAddress: org.streetAddress,
          postalCode: org.postalCode,
          addressLocality: org.city,
          addressCountry: org.country,
        }
      : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  }
}

export function websiteNode(settings: SiteSettings, lang: LocaleId): Node {
  return {
    '@type': 'WebSite',
    '@id': ids.website(lang),
    url: absoluteUrl(docPath('home', lang)),
    name: settings.siteName || siteConfig.name,
    description: siteConfig.description[lang],
    inLanguage: localeInfo(lang).hreflang,
    publisher: { '@id': ids.organization() },
    about: settings.organization?.knowsAbout?.map((name) => ({ '@type': 'Thing', name })),
  }
}

export interface ImageInfo {
  url: string
  width?: number
  height?: number
  caption?: string
  credit?: string
}

export function imageNode(img: ImageInfo | undefined): Node | undefined {
  if (!img) return undefined
  return {
    '@type': 'ImageObject',
    url: img.url,
    contentUrl: img.url,
    width: img.width,
    height: img.height,
    caption: img.caption,
    creditText: img.credit,
  }
}

export function webPageNode(opts: {
  path: string
  lang: LocaleId
  title: string
  description?: string
  type?: string
  primaryImage?: ImageInfo
  datePublished?: string
  dateModified?: string
  hasBreadcrumb?: boolean
  reviewedBy?: Author
  /** CSS-Selektoren für sprachfähige Kernaussagen (speakable) */
  speakable?: string[]
  about?: Node | Node[]
  mainEntity?: Node
}): Node {
  return {
    '@type': opts.type ?? 'WebPage',
    '@id': ids.webpage(opts.path),
    url: absoluteUrl(opts.path),
    name: opts.title,
    description: opts.description,
    inLanguage: localeInfo(opts.lang).hreflang,
    isPartOf: { '@id': ids.website(opts.lang) },
    primaryImageOfPage: imageNode(opts.primaryImage),
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    breadcrumb: opts.hasBreadcrumb ? { '@id': ids.breadcrumb(opts.path) } : undefined,
    reviewedBy: opts.reviewedBy ? { '@id': ids.person(opts.reviewedBy) } : undefined,
    lastReviewed: opts.reviewedBy ? opts.dateModified : undefined,
    speakable: opts.speakable?.length ? { '@type': 'SpeakableSpecification', cssSelector: opts.speakable } : undefined,
    about: opts.about,
    mainEntity: opts.mainEntity,
  }
}

export interface Crumb {
  name: string
  path: string
}

export function breadcrumbNode(path: string, crumbs: Crumb[]): Node {
  return {
    '@type': 'BreadcrumbList',
    '@id': ids.breadcrumb(path),
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  }
}

export function personNode(author: Author, lang: LocaleId, imageUrl?: string): Node {
  return {
    '@type': 'Person',
    '@id': ids.person(author),
    name: author.name,
    url: absoluteUrl(docPath('author', lang, author.slug)),
    image: imageUrl,
    jobTitle: pick(author.jobTitle, lang),
    description: pick(author.bio, lang),
    knowsAbout: author.expertise?.length ? author.expertise : undefined,
    sameAs: author.links?.map((l) => l.url),
    worksFor: { '@id': ids.organization() },
  }
}

/** Kategorie als Thema (about) */
export function categoryThing(category: Category | undefined, lang: LocaleId): Node | undefined {
  const slug = category ? pick(category.slug, lang)?.current : undefined
  if (!category || !slug) return undefined
  return { '@type': 'Thing', name: pick(category.title, lang), url: absoluteUrl(docPath('category', lang, slug)) }
}

/** Übersetzungsbeziehungen: Hauptsprache = Original, andere = Übersetzung */
function translationLinks(type: RoutableType, lang: LocaleId, translations: Translation[] | undefined): Node {
  const others = (translations ?? []).filter((t) => t.language !== lang)
  if (!others.length) return {}
  const ref = (t: Translation) => ({ '@id': ids.article(docPath(t._type, t.language, t.slug)) })
  if (lang === defaultLocale) return { workTranslation: others.map(ref) }
  const original = others.find((t) => t.language === defaultLocale)
  return original ? { translationOfWork: ref(original) } : {}
}

export function articleNode(opts: {
  type: 'BlogPosting' | 'Article' | 'Review'
  path: string
  lang: LocaleId
  headline: string
  description: string
  image?: ImageInfo
  datePublished: string
  dateModified?: string
  authors: Author[]
  category?: Category
  mentions?: Node[]
  sources?: Source[]
  keywords?: string
  wordCount?: number
  translations?: Translation[]
  docType: RoutableType
}): Node {
  return {
    '@type': opts.type,
    '@id': ids.article(opts.path),
    mainEntityOfPage: { '@id': ids.webpage(opts.path) },
    headline: opts.headline.slice(0, 110),
    description: opts.description,
    abstract: opts.description,
    image: imageNode(opts.image),
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    inLanguage: localeInfo(opts.lang).hreflang,
    author: opts.authors.map((a) => ({ '@id': ids.person(a) })),
    publisher: { '@id': ids.organization() },
    isPartOf: { '@id': ids.website(opts.lang) },
    articleSection: opts.category ? pick(opts.category.title, opts.lang) : undefined,
    about: categoryThing(opts.category, opts.lang),
    mentions: opts.mentions,
    citation: opts.sources?.length
      ? opts.sources.map((s) => ({
          '@type': 'CreativeWork',
          name: s.title,
          url: s.url,
          publisher: s.publisher ? { '@type': 'Organization', name: s.publisher } : undefined,
          datePublished: s.date,
        }))
      : undefined,
    keywords: opts.keywords,
    wordCount: opts.wordCount,
    isAccessibleForFree: true,
    ...translationLinks(opts.docType, opts.lang, opts.translations),
  }
}

export function faqNode(path: string, items: FaqItem[]): Node | undefined {
  if (!items.length) return undefined
  return {
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(path)}#faq`,
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: plain(q.answer) },
    })),
  }
}

/** Rangliste eines Vergleichs */
export function comparisonListNode(path: string, items: ComparisonItem[], lang: LocaleId): Node {
  return {
    '@type': 'ItemList',
    '@id': `${absoluteUrl(path)}#itemlist`,
    numberOfItems: items.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: items.map((item, i) => {
      const review = refHref(item.review, lang)
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        url: review ? absoluteUrl(review) : `${absoluteUrl(path)}#${item._key}`,
        description: [item.bestFor, item.summary].filter(Boolean).join(' – '),
      }
    }),
  }
}

/** Einfache Liste verlinkter Seiten (Kategorien, Hubs, Autoren) */
export function linkListNode(path: string, items: { name: string; path: string }[]): Node | undefined {
  if (!items.length) return undefined
  return {
    '@type': 'ItemList',
    '@id': `${absoluteUrl(path)}#itemlist`,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  }
}

/** Testbericht: Software (SoftwareApplication) oder Produkt mit eingebettetem Review */
export function productReviewNodes(opts: {
  path: string
  lang: LocaleId
  review: Review
  productImage?: string
}): Node {
  const { review, lang } = opts
  const p = review.product
  const isSoftware = p.productType !== 'product'
  const offers =
    typeof p.priceFrom === 'number'
      ? {
          '@type': 'Offer',
          price: p.priceFrom,
          priceCurrency: 'EUR',
          url: p.url,
          description: p.freePlan,
        }
      : undefined
  return {
    '@type': isSoftware ? 'SoftwareApplication' : 'Product',
    '@id': `${absoluteUrl(opts.path)}#product`,
    name: p.name,
    ...(isSoftware
      ? {
          applicationCategory: p.applicationCategory ?? 'BusinessApplication',
          operatingSystem: p.operatingSystem || undefined,
          publisher: { '@type': 'Organization', name: p.brand },
        }
      : { brand: { '@type': 'Brand', name: p.brand } }),
    image: opts.productImage,
    url: p.url,
    offers,
    review: {
      '@type': 'Review',
      '@id': `${absoluteUrl(opts.path)}#review`,
      name: review.title,
      reviewBody: review.verdict,
      datePublished: review.publishedAt,
      dateModified: review.updatedAt ?? review.publishedAt,
      inLanguage: localeInfo(lang).hreflang,
      url: absoluteUrl(opts.path),
      author: review.authors.map((a) => ({ '@type': 'Person', '@id': ids.person(a), name: a.name })),
      publisher: { '@id': ids.organization() },
      reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5, worstRating: 0.5 },
      positiveNotes: review.pros?.length
        ? {
            '@type': 'ItemList',
            itemListElement: review.pros.map((name, i) => ({ '@type': 'ListItem', position: i + 1, name })),
          }
        : undefined,
      negativeNotes: review.cons?.length
        ? {
            '@type': 'ItemList',
            itemListElement: review.cons.map((name, i) => ({ '@type': 'ListItem', position: i + 1, name })),
          }
        : undefined,
    },
  }
}

export function definedTermSetNode(lang: LocaleId, name: string, description: string, terms: GlossaryTerm[]): Node {
  return {
    '@type': 'DefinedTermSet',
    '@id': ids.glossarySet(lang),
    name,
    description,
    url: absoluteUrl(docPath('glossaryIndex', lang)),
    inLanguage: localeInfo(lang).hreflang,
    publisher: { '@id': ids.organization() },
    hasDefinedTerm: terms.map((t) => ({ '@id': ids.term(lang, t.slug) })),
  }
}

export function definedTermNode(term: GlossaryTerm): Node {
  const path = docPath('glossaryTerm', term.language, term.slug)
  return {
    '@type': 'DefinedTerm',
    '@id': ids.term(term.language, term.slug),
    name: term.title,
    alternateName: term.alternateNames?.length ? term.alternateNames : undefined,
    description: term.shortDefinition,
    url: absoluteUrl(path),
    inLanguage: localeInfo(term.language).hreflang,
    sameAs: term.sameAs?.length ? term.sameAs : undefined,
    inDefinedTermSet: { '@id': ids.glossarySet(term.language) },
  }
}

/** Entfernt undefined-Werte rekursiv (sauberes JSON) */
export function compact<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
