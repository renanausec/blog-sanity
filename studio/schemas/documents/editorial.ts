/**
 * Redaktionelle Inhaltstypen mit Übersetzung auf Dokumentebene:
 * Artikel, Vergleich/Liste, Review.
 */
import { defineArrayMember, defineField, defineType } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { SplitHorizontalIcon } from '@sanity/icons/SplitHorizontal'
import { StarIcon } from '@sanity/icons/Star'
import {
  authorsField,
  categoryField,
  contentGroups,
  excerptField,
  faqField,
  formatDate,
  langBadge,
  languageField,
  mainImageField,
  publishedAtField,
  keyTakeawaysField,
  relatedField,
  reviewedByField,
  sourcesField,
  seoField,
  slugField,
  updatedAtField,
} from '../shared'
import { rootSlugTypes } from '../../../shared/routing'
import { ratingField } from '../objects/products'

const titleField = defineField({
  name: 'title',
  title: 'Titel (H1)',
  type: 'string',
  group: 'content',
  description:
    'Sichtbare Überschrift. Enthält das Haupt-Keyword möglichst vorne, klar und konkret (z. B. „ERP-System auswählen: Der Ratgeber für den Mittelstand“). 40–80 Zeichen ideal.',
  validation: (rule) => [rule.required(), rule.max(110).warning('Titel über 110 Zeichen sind schwer lesbar.')],
})

const editorialPreview = (kind: string) => ({
  select: {
    title: 'title',
    language: 'language',
    date: 'publishedAt',
    category: 'category.title.de',
    media: 'mainImage',
  },
  prepare: ({ title, language, date, category, media }: Record<string, any>) => ({
    title: title || 'Ohne Titel',
    subtitle: [langBadge(language), kind, category, formatDate(date)].filter(Boolean).join(' · '),
    media,
  }),
})

export const article = defineType({
  name: 'article',
  title: 'Artikel',
  type: 'document',
  icon: DocumentTextIcon,
  groups: contentGroups,
  fields: [
    languageField,
    titleField,
    { ...slugField('title', rootSlugTypes), group: 'content' },
    excerptField,
    keyTakeawaysField,
    mainImageField,
    defineField({
      name: 'body',
      title: 'Text',
      type: 'richText',
      group: 'content',
      description:
        'Gliederung mit H2 (gern als Frage formuliert, z. B. „Was kostet ein ERP-System?“) und H3. Jeder Abschnitt beginnt mit dem Kernsatz. Listen/Tabellen für Aufzählungen und Vergleiche, Hinweisboxen für Tipps. Fachbegriffe werden automatisch mit dem Glossar verlinkt; interne Links auf passende Artikel setzen.',
      validation: (rule) => rule.required(),
    }),
    authorsField,
    categoryField,
    publishedAtField,
    updatedAtField,
    reviewedByField,
    sourcesField,
    relatedField(['article', 'comparison', 'review', 'glossaryTerm']),
    faqField,
    seoField,
  ],
  orderings: [
    { title: 'Neueste zuerst', name: 'publishedDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: editorialPreview('Artikel'),
})

export const comparison = defineType({
  name: 'comparison',
  title: 'Vergleich / Liste',
  type: 'document',
  icon: SplitHorizontalIcon,
  groups: contentGroups,
  fields: [
    languageField,
    titleField,
    { ...slugField('title', ['comparison']), group: 'content' },
    excerptField,
    keyTakeawaysField,
    mainImageField,
    defineField({
      name: 'intro',
      title: 'Einleitung',
      type: 'richText',
      group: 'content',
      description: 'Optional: Methodik, Auswahlkriterien.',
    }),
    defineField({
      name: 'items',
      title: 'Einträge (in Reihenfolge des Rankings)',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'comparisonItem' })],
      validation: (rule) => rule.required().min(2),
    }),
    defineField({
      name: 'comparisonTable',
      title: 'Vergleichstabelle',
      type: 'table',
      group: 'content',
      description: 'Erste Zeile = Merkmale bzw. Anbieternamen.',
    }),
    defineField({
      name: 'body',
      title: 'Fazit / weiterer Text',
      type: 'richText',
      group: 'content',
    }),
    authorsField,
    categoryField,
    publishedAtField,
    updatedAtField,
    reviewedByField,
    sourcesField,
    relatedField(['article', 'comparison', 'review', 'glossaryTerm']),
    faqField,
    seoField,
  ],
  orderings: [
    { title: 'Neueste zuerst', name: 'publishedDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: editorialPreview('Vergleich'),
})

export const review = defineType({
  name: 'review',
  title: 'Review',
  type: 'document',
  icon: StarIcon,
  groups: contentGroups,
  fields: [
    languageField,
    titleField,
    { ...slugField('title', ['review']), group: 'content' },
    excerptField,
    keyTakeawaysField,
    mainImageField,
    defineField({
      name: 'product',
      title: 'Getestetes Produkt',
      type: 'product',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    { ...ratingField(true), group: 'content' },
    defineField({
      name: 'pros',
      title: 'Vorteile',
      type: 'array',
      group: 'content',
      of: [{ type: 'string' }],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'cons',
      title: 'Nachteile',
      type: 'array',
      group: 'content',
      of: [{ type: 'string' }],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'verdict',
      title: 'Fazit / Urteil',
      type: 'text',
      rows: 4,
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'body', title: 'Testbericht', type: 'richText', group: 'content' }),
    authorsField,
    categoryField,
    publishedAtField,
    updatedAtField,
    reviewedByField,
    sourcesField,
    relatedField(['article', 'comparison', 'review', 'glossaryTerm']),
    faqField,
    seoField,
  ],
  orderings: [
    { title: 'Neueste zuerst', name: 'publishedDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: {
    select: {
      title: 'title',
      language: 'language',
      rating: 'rating',
      product: 'product.name',
      media: 'mainImage',
    },
    prepare: ({ title, language, rating, product, media }) => ({
      title: title || 'Ohne Titel',
      subtitle: [langBadge(language), 'Review', product, rating ? `${rating}/5` : null].filter(Boolean).join(' · '),
      media,
    }),
  },
})
