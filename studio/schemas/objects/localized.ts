/**
 * Feldübersetzung für sprachneutrale Dokumente (Autor, Kategorie, Einstellungen).
 * Es entsteht je Sprache aus site.config.ts ein Unterfeld: { de: …, en: … }.
 * In GROQ: title.de, slug.en.current usw.
 */
import { defineField, defineType, type SlugValidationContext } from 'sanity'
import { defaultLocale, siteConfig } from '../../../site.config'
import { apiVersion } from '../shared'

export const localeString = defineType({
  name: 'localeString',
  title: 'Text (mehrsprachig)',
  type: 'object',
  fields: siteConfig.locales.map((l) =>
    defineField({
      name: l.id,
      title: l.title,
      type: 'string',
      validation: (rule) => (l.id === defaultLocale ? rule.required() : rule),
    }),
  ),
})

export const localeText = defineType({
  name: 'localeText',
  title: 'Absatz (mehrsprachig)',
  type: 'object',
  fields: siteConfig.locales.map((l) =>
    defineField({
      name: l.id,
      title: l.title,
      type: 'text',
      rows: 3,
    }),
  ),
})

/** Slug je Sprache, Quelle ist das gleichnamige Unterfeld von `title` bzw. `name` */
export const localeSlug = defineType({
  name: 'localeSlug',
  title: 'Slug (mehrsprachig)',
  type: 'object',
  fields: siteConfig.locales.map((l) =>
    defineField({
      name: l.id,
      title: l.title,
      type: 'slug',
      options: {
        source: (doc) => {
          const d = doc as { title?: Record<string, string>; name?: Record<string, string> }
          return d.title?.[l.id] ?? d.name?.[l.id] ?? ''
        },
        maxLength: 60,
        isUnique: async (slug: string, ctx: SlugValidationContext) => {
          const { document, getClient } = ctx
          if (!document) return true
          const published = document._id.replace(/^drafts\./, '')
          return getClient({ apiVersion }).fetch<boolean>(
            `!defined(*[_type == $type && slug[$lang].current == $slug && !(_id in [$draft, $published]) && !(_id in path("versions.**"))][0]._id)`,
            { type: document._type, lang: l.id, slug, draft: `drafts.${published}`, published },
          )
        },
      },
      validation: (rule) =>
        rule.required().custom((value) =>
          value?.current && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current)
            ? 'Nur a–z, 0–9 und einfache Bindestriche erlaubt.'
            : true,
        ),
    }),
  ),
})
