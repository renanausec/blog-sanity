/**
 * Sprachneutrale Dokumente mit übersetzten Feldern: Autor und Kategorie.
 * Ein Dokument gilt für alle Sprachen → Referenzen sind sprachunabhängig.
 */
import { defineArrayMember, defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons/Tag'
import { UserIcon } from '@sanity/icons/User'
import { apiVersion } from '../shared'

export const author = defineType({
  name: 'author',
  title: 'Autor',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      description: 'Gleich in allen Sprachen: /autor/<slug>/ und /en/author/<slug>/',
      options: {
        source: 'name',
        maxLength: 60,
        isUnique: async (slug, { document, getClient }) => {
          if (!document) return true
          const published = document._id.replace(/^drafts\./, '')
          return getClient({ apiVersion }).fetch<boolean>(
            `!defined(*[_type == "author" && slug.current == $slug && !(_id in [$draft, $published])][0]._id)`,
            { slug, draft: `drafts.${published}`, published },
          )
        },
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'image', title: 'Foto', type: 'figure' }),
    defineField({
      name: 'jobTitle',
      title: 'Fachgebiet / Position',
      type: 'localeString',
      description: 'z. B. „ERP-Beraterin“, „Redakteur für KI“. Wird als jobTitle/knowsAbout genutzt.',
    }),
    defineField({ name: 'bio', title: 'Kurzbiografie', type: 'localeText' }),
    defineField({
      name: 'expertise',
      title: 'Themenschwerpunkte',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Schlagworte für schema.org knowsAbout (sprachneutral, z. B. „ERP“, „SAP“).',
    }),
    defineField({
      name: 'links',
      title: 'Profile & Links',
      type: 'array',
      description: 'LinkedIn, Website usw. – erscheinen als sameAs im Person-Schema.',
      of: [
        defineArrayMember({
          name: 'profileLink',
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Bezeichnung', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (rule) => rule.required().uri({ scheme: ['https'] }),
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'url' } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'jobTitle.de', media: 'image' },
  },
})

export const category = defineType({
  name: 'category',
  title: 'Kategorie',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({ name: 'title', title: 'Name', type: 'localeString', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', title: 'Slug (URL)', type: 'localeSlug', validation: (rule) => rule.required() }),
    defineField({
      name: 'description',
      title: 'Beschreibung',
      type: 'localeText',
      description: 'Erscheint oben auf der Kategorieseite und als Meta-Description.',
    }),
    defineField({
      name: 'order',
      title: 'Reihenfolge',
      type: 'number',
      description: 'Kleinere Zahl = weiter vorne in Navigation und Listen.',
      initialValue: 10,
    }),
    defineField({
      name: 'noIndex',
      title: 'noindex',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  orderings: [{ title: 'Reihenfolge', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { de: 'title.de', en: 'title.en' },
    prepare: ({ de, en }) => ({ title: de, subtitle: en ? `EN: ${en}` : 'EN fehlt' }),
  },
})
