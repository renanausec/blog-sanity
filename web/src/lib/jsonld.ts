/**
 * Strukturierte Daten (schema.org, JSON-LD).
 * Alle Knoten einer Seite werden als @graph ausgegeben und über @id verknüpft.
 */
import { toPlainText } from 'astro-portabletext'
import { siteConfig, type LocaleId } from '../../../site.config'
import { absoluteUrl, docPath } from '../../../shared/routing'
import { localeInfo, pick } from './i18n'
import type { Author, ComparisonItem, FaqItem, GlossaryTerm, PortableTextValue, SiteSettings } from './types'

type Node = Record<string, unknown>

export const ids = {
  organization: () => absoluteUrl('/#organization'),
  website: (lang: LocaleId) => `${absoluteUrl(docPath('home', lang))}#website`,
  webpage: (path: string) => `${absoluteUrl(path)}#webpage`,
  breadcrumb: (path: string) => `${absoluteUrl(path)}#breadcrumb`,
  person: (author: Author) => `${absoluteUrl(docPath('author', siteConfig.locales[0].id, author.slug))}#person`,
  glossarySet: (lang: LocaleId) => `${absoluteUrl(docPath('glossaryIndex', lang))}#termset`,
}

export function plain(value: PortableTextValue | undefined): string {
  return value?.length ? toPlainText(value as never).trim() : ''
}

export function organizationNode(settings: SiteSettings, logoUrl?: string): Node {
  const org = settings.organization ?? {}
  const sameAs = Object.values(siteConfig.social).filter(Boolean)
  return {
    '@type': 'Organization',
    '@id': ids.organization(),
    name: settings.siteName || siteConfig.name,
    legalName: org.legalName || undefined,
    url: absoluteUrl('/'),
    logo: logoUrl ? { '@type': 'ImageObject', url: logoUrl } : undefined,
    email: org.email || undefined,
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
  }
}

export function webPageNode(opts: {
  path: string
  lang: LocaleId
  title: string
  description?: string
  type?: string
  primaryImage?: string
  datePublished?: string
  dateModified?: string
  hasBreadcrumb?: boolean
}): Node {
  return {
    '@type': opts.type ?? 'WebPage',
    '@id': ids.webpage(opts.path),
    url: absoluteUrl(opts.path),
    name: opts.title,
    description: opts.description,
    inLanguage: localeInfo(opts.lang).hreflang,
    isPartOf: { '@id': ids.website(opts.lang) },
    primaryImageOfPage: opts.primaryImage ? { '@type': 'ImageObject', url: opts.primaryImage } : undefined,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    breadcrumb: opts.hasBreadcrumb ? { '@id': ids.breadcrumb(opts.path) } : undefined,
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

export function articleNode(opts: {
  type: 'BlogPosting' | 'Article'
  path: string
  lang: LocaleId
  headline: string
  description: string
  image?: string
  datePublished: string
  dateModified?: string
  authors: Author[]
  section?: string
  wordCount?: number
}): Node {
  return {
    '@type': opts.type,
    '@id': `${absoluteUrl(opts.path)}#article`,
    mainEntityOfPage: { '@id': ids.webpage(opts.path) },
    headline: opts.headline.slice(0, 110),
    description: opts.description,
    image: opts.image ? [opts.image] : undefined,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    inLanguage: localeInfo(opts.lang).hreflang,
    author: opts.authors.map((a) => ({ '@id': ids.person(a) })),
    publisher: { '@id': ids.organization() },
    articleSection: opts.section,
    wordCount: opts.wordCount,
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

export function itemListNode(path: string, items: ComparisonItem[]): Node {
  return {
    '@type': 'ItemList',
    '@id': `${absoluteUrl(path)}#itemlist`,
    numberOfItems: items.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: `${absoluteUrl(path)}#${item._key}`,
    })),
  }
}

export function productReviewNodes(opts: {
  path: string
  lang: LocaleId
  product: { name: string; brand: string; url?: string; priceFrom?: number }
  productImage?: string
  rating: number
  pros: string[]
  cons: string[]
  verdict: string
  authors: Author[]
  datePublished: string
}): Node {
  const reviewId = `${absoluteUrl(opts.path)}#review`
  return {
    '@type': 'Product',
    '@id': `${absoluteUrl(opts.path)}#product`,
    name: opts.product.name,
    brand: { '@type': 'Brand', name: opts.product.brand },
    image: opts.productImage,
    url: opts.product.url,
    review: {
      '@type': 'Review',
      '@id': reviewId,
      name: `${opts.product.name}`,
      reviewBody: opts.verdict,
      datePublished: opts.datePublished,
      inLanguage: localeInfo(opts.lang).hreflang,
      author: opts.authors.map((a) => ({ '@type': 'Person', '@id': ids.person(a), name: a.name })),
      publisher: { '@id': ids.organization() },
      reviewRating: { '@type': 'Rating', ratingValue: opts.rating, bestRating: 5, worstRating: 0.5 },
      positiveNotes: opts.pros.length
        ? {
            '@type': 'ItemList',
            itemListElement: opts.pros.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p })),
          }
        : undefined,
      negativeNotes: opts.cons.length
        ? {
            '@type': 'ItemList',
            itemListElement: opts.cons.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c })),
          }
        : undefined,
    },
  }
}

export function definedTermSetNode(lang: LocaleId, name: string, terms: GlossaryTerm[]): Node {
  return {
    '@type': 'DefinedTermSet',
    '@id': ids.glossarySet(lang),
    name,
    url: absoluteUrl(docPath('glossaryIndex', lang)),
    inLanguage: localeInfo(lang).hreflang,
    hasDefinedTerm: terms.map((t) => ({ '@id': `${absoluteUrl(docPath('glossaryTerm', lang, t.slug))}#term` })),
  }
}

export function definedTermNode(term: GlossaryTerm): Node {
  const path = docPath('glossaryTerm', term.language, term.slug)
  return {
    '@type': 'DefinedTerm',
    '@id': `${absoluteUrl(path)}#term`,
    name: term.title,
    description: term.shortDefinition,
    url: absoluteUrl(path),
    inDefinedTermSet: { '@id': ids.glossarySet(term.language) },
  }
}

/** Entfernt undefined-Werte rekursiv (sauberes JSON) */
export function compact<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
