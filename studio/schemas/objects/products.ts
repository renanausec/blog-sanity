/**
 * Objekte für Vergleiche und Reviews.
 */
import { defineField, defineType } from 'sanity'
import { PackageIcon } from '@sanity/icons/Package'
import { StarFilledIcon } from '@sanity/icons/StarFilled'

/** Bewertung 0,5–5 in halben Schritten */
export const ratingField = (required: boolean) =>
  defineField({
    name: 'rating',
    title: required ? 'Bewertung (1–5)' : 'Bewertung (optional, 1–5)',
    type: 'number',
    options: { list: [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5] },
    validation: (rule) => {
      const base = rule.min(0.5).max(5).precision(1)
      return required ? base.required() : base
    },
  })

/** Ein Eintrag in einem Vergleich / einer Liste */
export const comparisonItem = defineType({
  name: 'comparisonItem',
  title: 'Eintrag',
  type: 'object',
  icon: StarFilledIcon,
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'badge', title: 'Auszeichnung', type: 'string', description: 'z. B. „Testsieger“, „Preis-Tipp“' }),
    defineField({ name: 'image', title: 'Bild / Logo', type: 'figure' }),
    defineField({
      name: 'summary',
      title: 'Kurzfazit',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'pros', title: 'Vorteile', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'cons', title: 'Nachteile', type: 'array', of: [{ type: 'string' }] }),
    ratingField(false),
    defineField({
      name: 'url',
      title: 'Website des Anbieters',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'review',
      title: 'Eigener Testbericht',
      type: 'reference',
      to: [{ type: 'review' }],
      options: {
        filter: ({ document }) => ({
          filter: 'language == $lang',
          params: { lang: (document as { language?: string }).language },
        }),
      },
    }),
  ],
  preview: {
    select: { title: 'name', rating: 'rating', badge: 'badge', media: 'image' },
    prepare: ({ title, rating, badge, media }) => ({
      title,
      subtitle: [badge, rating ? `${rating}/5` : null].filter(Boolean).join(' · '),
      media,
    }),
  },
})

/** Getestetes Produkt (→ schema.org Product) */
export const product = defineType({
  name: 'product',
  title: 'Produkt',
  type: 'object',
  icon: PackageIcon,
  fields: [
    defineField({ name: 'name', title: 'Produktname', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'brand', title: 'Hersteller / Marke', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'image', title: 'Produktbild / Logo', type: 'figure' }),
    defineField({
      name: 'url',
      title: 'Offizielle Website',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'priceFrom',
      title: 'Preis ab (EUR / Monat)',
      type: 'number',
      description: 'Optional. 0 = kostenloser Plan verfügbar.',
      validation: (rule) => rule.min(0),
    }),
  ],
})
