/**
 * Glossar, Landingpages und einfache Seiten (Kontakt, Redaktionelle Richtlinien, Impressum, Datenschutz).
 */
import { defineArrayMember, defineField, defineType } from 'sanity'
import { BookIcon } from '@sanity/icons/Book'
import { DocumentIcon } from '@sanity/icons/Document'
import { RocketIcon } from '@sanity/icons/Rocket'
import { contentGroups, faqField, langBadge, languageField, sameLanguageFilter, seoField, slugField } from '../shared'
import { rootSlugTypes } from '../../../shared/routing'
import { landingSections } from '../objects/sections'

export const glossaryTerm = defineType({
  name: 'glossaryTerm',
  title: 'Glossarbegriff',
  type: 'document',
  icon: BookIcon,
  groups: contentGroups,
  fields: [
    languageField,
    defineField({
      name: 'title',
      title: 'Begriff',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    { ...slugField('title', ['glossaryTerm']), group: 'content' },
    defineField({
      name: 'shortDefinition',
      title: 'Kurzdefinition',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Direkte Antwort auf „Was ist …?“ in 1–2 Sätzen. Erscheint im Index und als DefinedTerm-Beschreibung.',
      validation: (rule) => [rule.required(), rule.max(300).warning('Kurzdefinition bitte unter 300 Zeichen halten.')],
    }),
    defineField({
      name: 'body',
      title: 'Ausführliche Erklärung',
      type: 'richText',
      group: 'content',
    }),
    defineField({
      name: 'relatedTerms',
      title: 'Verwandte Begriffe',
      type: 'array',
      group: 'meta',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'glossaryTerm' }], options: { filter: sameLanguageFilter } })],
      validation: (rule) => rule.unique().max(8),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Aktualisiert am',
      type: 'datetime',
      group: 'meta',
    }),
    faqField,
    seoField,
  ],
  orderings: [{ title: 'A–Z', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', language: 'language', def: 'shortDefinition' },
    prepare: ({ title, language, def }) => ({
      title,
      subtitle: `${langBadge(language)} · ${def ?? ''}`,
    }),
  },
})

export const landingPage = defineType({
  name: 'landingPage',
  title: 'Landingpage',
  type: 'document',
  icon: RocketIcon,
  groups: contentGroups,
  fields: [
    languageField,
    defineField({
      name: 'title',
      title: 'Interner Titel',
      type: 'string',
      group: 'content',
      description: 'Für die Übersicht und als Meta-Title-Fallback. Die sichtbare H1 kommt aus dem Hero.',
      validation: (rule) => rule.required(),
    }),
    { ...slugField('title', rootSlugTypes), group: 'content' },
    defineField({
      name: 'sections',
      title: 'Abschnitte',
      type: 'array',
      group: 'content',
      of: landingSections.map((type) => defineArrayMember({ type })),
      validation: (rule) =>
        rule.required().min(1).custom((sections) => {
          const list = (sections as { _type: string }[] | undefined) ?? []
          const heroes = list.filter((s) => s._type === 'heroSection').length
          if (heroes > 1) return 'Nur ein Hero pro Seite (sonst mehrere H1).'
          if (heroes === 1 && list[0]?._type !== 'heroSection') return 'Der Hero muss der erste Abschnitt sein.'
          return true
        }),
    }),
    faqField,
    seoField,
  ],
  preview: {
    select: { title: 'title', language: 'language', slug: 'slug.current' },
    prepare: ({ title, language, slug }) => ({ title, subtitle: `${langBadge(language)} · /${slug ?? ''}` }),
  },
})

export const page = defineType({
  name: 'page',
  title: 'Seite',
  type: 'document',
  icon: DocumentIcon,
  groups: contentGroups,
  fields: [
    languageField,
    defineField({
      name: 'title',
      title: 'Titel (H1)',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    { ...slugField('title', rootSlugTypes), group: 'content' },
    defineField({
      name: 'intro',
      title: 'Einleitung',
      type: 'text',
      rows: 3,
      group: 'content',
    }),
    defineField({
      name: 'body',
      title: 'Text',
      type: 'richText',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Stand',
      type: 'datetime',
      group: 'meta',
      description: 'z. B. für Datenschutzerklärung („Stand: …“).',
    }),
    faqField,
    seoField,
  ],
  preview: {
    select: { title: 'title', language: 'language', slug: 'slug.current' },
    prepare: ({ title, language, slug }) => ({ title, subtitle: `${langBadge(language)} · /${slug ?? ''}` }),
  },
})
