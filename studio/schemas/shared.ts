/**
 * Wiederverwendbare Felder, Validierungen und Hilfsfunktionen für alle Schemas.
 */
import { defineField, type SlugValidationContext, type ReferenceFilterResolverContext } from 'sanity'
import { localeIds, siteConfig, type LocaleId } from '../../site.config'
import { reservedRootSlugs, rootSlugTypes } from '../../shared/routing'

export const apiVersion = siteConfig.sanity.apiVersion

/** Feldgruppen, die in fast allen Inhaltsdokumenten verwendet werden */
export const contentGroups = [
  { name: 'content', title: 'Inhalt', default: true },
  { name: 'meta', title: 'Metadaten' },
  { name: 'faq', title: 'FAQ' },
  { name: 'seo', title: 'SEO' },
]

/** Sprachfeld – wird vom Plugin document-internationalization gesetzt */
export const languageField = defineField({
  name: 'language',
  title: 'Sprache',
  type: 'string',
  readOnly: true,
  hidden: true,
  validation: (rule) => rule.required(),
})

/** Ermittelt die Sprache eines Dokuments bzw. (bei Einstellungen) des Sprach-Unterfelds */
export function languageFromContext(ctx: {
  document?: unknown
  parentPath?: readonly unknown[]
  path?: readonly unknown[]
}): LocaleId | undefined {
  const fromDoc = (ctx.document as { language?: unknown } | null | undefined)?.language
  if (typeof fromDoc === 'string' && localeIds.includes(fromDoc as LocaleId)) return fromDoc as LocaleId
  const path = ctx.parentPath ?? ctx.path ?? []
  return path.find((p): p is LocaleId => typeof p === 'string' && localeIds.includes(p as LocaleId))
}

/** Referenzfilter: nur Dokumente derselben Sprache anbieten */
export function sameLanguageFilter(ctx: ReferenceFilterResolverContext) {
  const lang = languageFromContext(ctx)
  return lang ? { filter: 'language == $lang', params: { lang } } : {}
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Slug-Feld mit Eindeutigkeit je Sprache.
 * `group` = alle Typen, die sich denselben URL-Raum teilen.
 */
export function slugField(source: string, group: readonly string[]) {
  const isRoot = group.some((t) => (rootSlugTypes as readonly string[]).includes(t))
  return defineField({
    name: 'slug',
    title: 'Slug (URL)',
    type: 'slug',
    description: 'Nur Kleinbuchstaben, Ziffern und Bindestriche. Eindeutig je Sprache.',
    options: {
      source,
      maxLength: 80,
      isUnique: isUniqueInGroup(group),
    },
    validation: (rule) =>
      rule.required().custom((value, ctx) => {
        const slug = value?.current
        if (!slug) return true
        if (!SLUG_PATTERN.test(slug)) return 'Nur a–z, 0–9 und einfache Bindestriche erlaubt.'
        const lang = languageFromContext(ctx)
        if (isRoot && lang && reservedRootSlugs(lang).includes(slug)) {
          return `„${slug}“ ist für eine feste Route reserviert.`
        }
        return true
      }),
  })
}

function isUniqueInGroup(group: readonly string[]) {
  return async (slug: string, ctx: SlugValidationContext) => {
    const { document, getClient } = ctx
    if (!document) return true
    const client = getClient({ apiVersion })
    const published = document._id.replace(/^drafts\./, '').replace(/^versions\.[^.]+\./, '')
    const params = {
      types: [...group],
      slug,
      language: (document as { language?: string }).language ?? null,
      draft: `drafts.${published}`,
      published,
    }
    const query = `!defined(*[
      _type in $types &&
      slug.current == $slug &&
      language == $language &&
      !(_id in [$draft, $published]) &&
      !(_id in path("versions.**"))
    ][0]._id)`
    return client.fetch<boolean>(query, params)
  }
}

/** Kurzantwort / Lead – wichtig für Featured Snippets und LLM-Zitate */
export const excerptField = defineField({
  name: 'excerpt',
  title: 'Kurzantwort',
  type: 'text',
  rows: 3,
  group: 'content',
  description:
    'Direkte Antwort auf die Kernfrage in 1–3 Sätzen. Steht ganz oben auf der Seite und dient als Fallback für die Meta-Description.',
  validation: (rule) => [
    rule.required(),
    rule.min(80).warning('Etwas knapp – mindestens ~80 Zeichen.'),
    rule.max(320).warning('Lang – eine Kurzantwort sollte unter ~320 Zeichen bleiben.'),
  ],
})

export const mainImageField = defineField({
  name: 'mainImage',
  title: 'Titelbild',
  type: 'figure',
  group: 'content',
})

export const authorsField = defineField({
  name: 'authors',
  title: 'Autor(en)',
  type: 'array',
  group: 'meta',
  of: [{ type: 'reference', to: [{ type: 'author' }] }],
  validation: (rule) => rule.required().min(1).unique(),
})

export const categoryField = defineField({
  name: 'category',
  title: 'Kategorie',
  type: 'reference',
  group: 'meta',
  to: [{ type: 'category' }],
  validation: (rule) => rule.required(),
})

export const publishedAtField = defineField({
  name: 'publishedAt',
  title: 'Veröffentlicht am',
  type: 'datetime',
  group: 'meta',
  initialValue: () => new Date().toISOString(),
  validation: (rule) => rule.required(),
})

export const updatedAtField = defineField({
  name: 'updatedAt',
  title: 'Aktualisiert am',
  type: 'datetime',
  group: 'meta',
  description: 'Nur bei inhaltlicher Überarbeitung setzen. Wird als „dateModified“ ausgegeben.',
  validation: (rule) =>
    rule.custom((value, ctx) => {
      const published = (ctx.document as { publishedAt?: string } | undefined)?.publishedAt
      if (value && published && value < published) return 'Darf nicht vor dem Veröffentlichungsdatum liegen.'
      return true
    }),
})

export function relatedField(types: string[], title = 'Verwandte Inhalte') {
  return defineField({
    name: 'related',
    title,
    type: 'array',
    group: 'meta',
    description: 'Max. 6. Nur Inhalte derselben Sprache.',
    of: [{ type: 'reference', to: types.map((type) => ({ type })), options: { filter: sameLanguageFilter } }],
    validation: (rule) => rule.max(6).unique(),
  })
}

export const faqField = defineField({
  name: 'faq',
  title: 'FAQ',
  type: 'array',
  group: 'faq',
  description: 'Optional. Wird als Akkordeon angezeigt und automatisch als FAQPage-Schema ausgegeben.',
  of: [{ type: 'faqItem' }],
})

export const seoField = defineField({
  name: 'seo',
  title: 'SEO',
  type: 'seo',
  group: 'seo',
})

/** Sprachkürzel für Vorschauen, z. B. "DE · …" */
export function langBadge(language?: string) {
  return language ? language.toUpperCase() : '??'
}

export function formatDate(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString('de-DE') : 'ohne Datum'
}
