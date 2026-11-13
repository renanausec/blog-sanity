import { localeIds } from '../../../site.config'

/**
 * GROQ-Abfragen. Es werden nur veröffentlichte Dokumente gelesen (perspective: published).
 * Referenzen (Bilder, Links, Autoren, Kategorien) werden direkt aufgelöst.
 */

/** Bild inkl. Asset-Metadaten (Abmessungen) */
const image = `{..., asset->{_id, url, metadata{dimensions, hasAlpha, isOpaque}}}`

/** Aufgelöstes Linkziel */
const linkRef = `{_type, language, "slug": select(_type == "category" => slug, slug.current), title, shortDefinition}`

/** Markierungen in Portable Text: interne Links und Glossar-Links auflösen */
const markDefs = `markDefs[]{
  ...,
  _type == "internalLink" => {"target": reference->${linkRef}},
  _type == "glossaryLink" => {"target": term->${linkRef}}
}`

const linkTarget = `{label, external, "internal": internal->${linkRef}}`

const simpleText = (field: string) => `${field}[]{..., ${markDefs}}`

/** Portable Text mit allen eigenen Blocktypen */
const richText = (field: string) => `${field}[]{
  ...,
  ${markDefs},
  _type == "figure" => ${image},
  _type == "callout" => {..., ${simpleText('body')}},
  _type == "cta" => {..., "link": link${linkTarget}}
}`

/** Portable Text unter beliebigem Pfad als Wert (z. B. body.de) */
const richTextOf = (path: string) => `${path}[]{
  ...,
  ${markDefs},
  _type == "figure" => ${image},
  _type == "callout" => {..., ${simpleText('body')}},
  _type == "cta" => {..., "link": link${linkTarget}}
}`

const faq = `faq[]{_key, question, ${simpleText('answer')}}`

const seo = `seo{..., ogImage${image}}`

const category = `{_id, title, slug, description, order, noIndex}`

/** Kategorie inkl. Hub-Text (nur für die Kategorie-Abfrage) */
const categoryFull = `{_id, title, slug, description, order, noIndex, "body": {${localeIds
  .map((l) => `"${l}": ${richTextOf(`body.${l}`)}`)
  .join(', ')}}}`

const author = `{_id, name, "slug": slug.current, image${image}, jobTitle, bio, expertise, links}`

/** Übersetzungen über das Metadaten-Dokument des Plugins document-internationalization */
const translations = `"translations": *[_type == "translation.metadata" && references(^._id)][0].translations[]{
  "language": coalesce(language, _key),
  "slug": value->slug.current,
  "_type": value->_type
}[defined(slug)]`

export const card = `{
  _id, _type, language, title, "slug": slug.current, excerpt, publishedAt, rating,
  mainImage${image},
  "category": category->${category}
}`

const base = `_id, _type, _updatedAt, language, title, "slug": slug.current, ${seo}, ${faq}, ${translations}`

const editorial = `
  ${base},
  excerpt, publishedAt, updatedAt,
  mainImage${image},
  "authors": authors[]->${author},
  "category": category->${category},
  ${richText('body')},
  "related": related[]->${card},
  keyTakeaways,
  sources,
  "reviewedBy": reviewedBy->${author}
`

const published = `defined(slug.current) && defined(language)`

/** Erzeugt {"de": …, "en": …} für alle Sprachen aus site.config.ts */
const perLocale = (build: (lang: string) => string) => localeIds.map((l) => `"${l}": ${build(l)}`).join(', ')

export const queries = {
  settings: `*[_id == "siteSettings"][0]{
    ...,
    logo${image}, favicon${image}, defaultOgImage${image},
    "mainNav": {${perLocale((l) => `mainNav.${l}[]${linkTarget}`)}},
    "footerNav": {${perLocale((l) => `footerNav.${l}[]${linkTarget}`)}},
    "legalPages": {${perLocale(
      (l) =>
        `{${['imprint', 'privacy', 'editorialPolicy', 'contact']
          .map((k) => `"${k}": legalPages.${l}.${k}->${linkRef}`)
          .join(', ')}}`,
    )}}
  }`,

  categories: `*[_type == "category"] | order(order asc, title.de asc) ${categoryFull}`,

  authors: `*[_type == "author" && defined(slug.current)] | order(name asc) ${author}`,

  articles: `*[_type == "article" && ${published}] | order(publishedAt desc) { ${editorial} }`,

  comparisons: `*[_type == "comparison" && ${published}] | order(publishedAt desc) {
    ${editorial},
    ${richText('intro')},
    items[]{..., image${image}, "review": review->${linkRef}},
    comparisonTable
  }`,

  reviews: `*[_type == "review" && ${published}] | order(publishedAt desc) {
    ${editorial},
    product{..., image${image}},
    rating, pros, cons, verdict
  }`,

  glossary: `*[_type == "glossaryTerm" && ${published}] | order(lower(title) asc) {
    ${base},
    shortDefinition, updatedAt, alternateNames, sameAs,
    "category": category->${category},
    ${richText('body')},
    "relatedTerms": relatedTerms[]->${linkRef}
  }`,

  landingPages: `*[_type == "landingPage" && ${published}] {
    ${base},
    sections[]{
      ...,
      _type == "heroSection" => {..., image${image}, "link": link${linkTarget}},
      _type == "textSection" => {..., ${richText('body')}},
      _type == "ctaSection" => {..., "link": link${linkTarget}},
      _type == "faqSection" => {..., items[]{_key, question, ${simpleText('answer')}}}
    }
  }`,

  pages: `*[_type == "page" && ${published}] {
    ${base},
    pageType, intro, updatedAt,
    ${richText('body')}
  }`,
}
