import { article, comparison, review } from './documents/editorial'
import { glossaryTerm, landingPage, page } from './documents/pages'
import { author, category } from './documents/taxonomy'
import { siteSettings } from './documents/siteSettings'
import { seo } from './objects/seo'
import { localeSlug, localeString, localeText } from './objects/localized'
import { callout, cta, faqItem, figure, linkTarget, prosCons, richText, simpleText, table } from './objects/content'
import { benefitsSection, ctaSection, faqSection, heroSection, textSection } from './objects/sections'
import { comparisonItem, product } from './objects/products'

/** Typen mit Übersetzung auf Dokumentebene (ein Dokument je Sprache) */
export const translatedTypes = ['article', 'comparison', 'review', 'glossaryTerm', 'landingPage', 'page']

/** Singletons – genau ein Dokument, feste ID = Typname */
export const singletonTypes = new Set(['siteSettings'])

export const schemaTypes = [
  // Dokumente
  article,
  comparison,
  review,
  glossaryTerm,
  landingPage,
  page,
  author,
  category,
  siteSettings,
  // Objekte
  seo,
  localeString,
  localeText,
  localeSlug,
  figure,
  simpleText,
  richText,
  linkTarget,
  table,
  callout,
  prosCons,
  cta,
  faqItem,
  heroSection,
  textSection,
  benefitsSection,
  ctaSection,
  faqSection,
  comparisonItem,
  product,
]
