/**
 * Oberflächentexte je Sprache und Hilfsfunktionen für Links und Datumsangaben.
 * Neue Sprache: in site.config.ts ergänzen und hier einen Eintrag in `ui` anlegen.
 */
import { siteConfig, type LocaleId } from '../../../site.config'
import { docPath, type RoutableType } from '../../../shared/routing'
import type { Category, LinkRef, LinkTarget, Localized } from './types'

export const ui = {
  de: {
    skipToContent: 'Zum Inhalt springen',
    home: 'Startseite',
    mainNav: 'Hauptnavigation',
    language: 'Sprache',
    switchLanguage: 'Diese Seite auf Deutsch',
    latest: 'Neueste Beiträge',
    featured: 'Im Fokus',
    readMore: 'Weiterlesen',
    publishedOn: 'Veröffentlicht am',
    updatedOn: 'Aktualisiert am',
    by: 'Von',
    and: 'und',
    minutesRead: (n: number) => `${n} Min. Lesezeit`,
    shortAnswer: 'Kurz gesagt',
    toc: 'Inhalt',
    faq: 'Häufige Fragen',
    related: 'Das könnte Sie auch interessieren',
    relatedTerms: 'Verwandte Begriffe',
    pros: 'Vorteile',
    cons: 'Nachteile',
    verdict: 'Fazit',
    rating: 'Bewertung',
    ratingOf: (r: number) => `${r.toLocaleString('de-DE')} von 5`,
    priceFrom: (p: number) => (p === 0 ? 'Kostenloser Plan verfügbar' : `ab ${p.toLocaleString('de-DE')} € / Monat`),
    visitWebsite: 'Zur Website',
    toReview: 'Zum Testbericht',
    comparisonTable: 'Vergleichstabelle',
    ranking: 'Unsere Auswahl',
    glossary: 'Glossar',
    glossaryIntro: 'Fachbegriffe rund um Business-Software einfach erklärt – von A bis Z.',
    glossaryJump: 'Zum Buchstaben springen',
    category: 'Kategorie',
    categories: 'Kategorien',
    author: 'Autor',
    articlesBy: (name: string) => `Beiträge von ${name}`,
    pagination: 'Seitennavigation',
    previous: 'Zurück',
    next: 'Weiter',
    page: (n: number, total: number) => `Seite ${n} von ${total}`,
    breadcrumb: 'Brotkrumennavigation',
    notFoundTitle: 'Seite nicht gefunden',
    notFoundText: 'Diese Seite gibt es nicht (mehr). Vielleicht hilft einer dieser Links weiter:',
    backHome: 'Zur Startseite',
    rss: 'RSS-Feed',
    noPosts: 'Hier gibt es noch keine Beiträge.',
    type: { article: 'Artikel', comparison: 'Vergleich', review: 'Test' } as Record<string, string>,
    legal: { imprint: 'Impressum', privacy: 'Datenschutz', editorialPolicy: 'Redaktionelle Richtlinien', contact: 'Kontakt' },
    copyright: (year: number, name: string) => `© ${year} ${name}`,
    callout: { info: 'Info', tip: 'Tipp', warning: 'Achtung', key: 'Wichtig' } as Record<string, string>,
  },
  en: {
    skipToContent: 'Skip to content',
    home: 'Home',
    mainNav: 'Main navigation',
    language: 'Language',
    switchLanguage: 'This page in English',
    latest: 'Latest posts',
    featured: 'Featured',
    readMore: 'Read more',
    publishedOn: 'Published',
    updatedOn: 'Updated',
    by: 'By',
    and: 'and',
    minutesRead: (n: number) => `${n} min read`,
    shortAnswer: 'In short',
    toc: 'Contents',
    faq: 'Frequently asked questions',
    related: 'You might also like',
    relatedTerms: 'Related terms',
    pros: 'Pros',
    cons: 'Cons',
    verdict: 'Verdict',
    rating: 'Rating',
    ratingOf: (r: number) => `${r.toLocaleString('en-US')} out of 5`,
    priceFrom: (p: number) => (p === 0 ? 'Free plan available' : `from €${p.toLocaleString('en-US')} / month`),
    visitWebsite: 'Visit website',
    toReview: 'Read the review',
    comparisonTable: 'Comparison table',
    ranking: 'Our picks',
    glossary: 'Glossary',
    glossaryIntro: 'Business software terms explained simply – from A to Z.',
    glossaryJump: 'Jump to letter',
    category: 'Category',
    categories: 'Categories',
    author: 'Author',
    articlesBy: (name: string) => `Posts by ${name}`,
    pagination: 'Pagination',
    previous: 'Previous',
    next: 'Next',
    page: (n: number, total: number) => `Page ${n} of ${total}`,
    breadcrumb: 'Breadcrumb',
    notFoundTitle: 'Page not found',
    notFoundText: 'This page does not exist (anymore). One of these links may help:',
    backHome: 'Back to home',
    rss: 'RSS feed',
    noPosts: 'No posts here yet.',
    type: { article: 'Article', comparison: 'Comparison', review: 'Review' } as Record<string, string>,
    legal: { imprint: 'Legal notice', privacy: 'Privacy policy', editorialPolicy: 'Editorial policy', contact: 'Contact' },
    copyright: (year: number, name: string) => `© ${year} ${name}`,
    callout: { info: 'Info', tip: 'Tip', warning: 'Warning', key: 'Key point' } as Record<string, string>,
  },
} satisfies Record<LocaleId, unknown>

export type UiStrings = (typeof ui)['de']

export function t(lang: LocaleId): UiStrings {
  return ui[lang] as UiStrings
}

export function localeInfo(lang: LocaleId) {
  return siteConfig.locales.find((l) => l.id === lang)!
}

/** Datumsformat je Sprache, z. B. „12. November 2026“ */
export function formatDate(iso: string | undefined, lang: LocaleId): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Berlin',
  }).format(new Date(iso))
}

/** Wert eines übersetzten Feldes, mit Rückfall auf die Hauptsprache */
export function pick<T>(value: Localized<T> | undefined, lang: LocaleId): T | undefined {
  return value?.[lang] ?? value?.[siteConfig.locales[0].id]
}

export function categoryPath(category: Category, lang: LocaleId): string {
  return docPath('category', lang, pick(category.slug, lang)?.current)
}

/** URL eines aufgelösten Linkziels */
export function refHref(ref: LinkRef | null | undefined, lang: LocaleId): string | undefined {
  if (!ref) return undefined
  if (ref._type === 'category') {
    const slug = (ref.slug as unknown as Localized<{ current: string }> | undefined)?.[lang]?.current
    return slug ? docPath('category', lang, slug) : undefined
  }
  if (!ref.slug) return undefined
  return docPath(ref._type as RoutableType, ref.language ?? lang, ref.slug)
}

export function refLabel(ref: LinkRef | null | undefined, lang: LocaleId): string | undefined {
  if (!ref) return undefined
  const title = ref.title as unknown
  if (title && typeof title === 'object') return pick(title as Localized, lang)
  return ref.title
}

export function linkHref(link: LinkTarget | undefined, lang: LocaleId): string | undefined {
  if (!link) return undefined
  return refHref(link.internal, lang) ?? link.external
}

export function isExternal(href: string | undefined): boolean {
  return !!href && /^(https?:)?\/\//.test(href) && !href.startsWith(siteConfig.url)
}

/** Geschätzte Lesezeit aus Fließtext */
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

/** Sprache aus der aktuellen URL (für Komponenten ohne lang-Prop, z. B. Portable-Text-Blöcke) */
export function langFromUrl(url: URL): LocaleId {
  const first = url.pathname.split('/')[1] as LocaleId
  return siteConfig.locales.some((l) => l.id === first) && first !== siteConfig.locales[0].id
    ? first
    : siteConfig.locales[0].id
}

/** Anker-ID aus Überschriftentext */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
