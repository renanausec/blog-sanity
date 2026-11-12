/**
 * Portable Text und Inhaltsblöcke:
 * Bild mit Bildunterschrift, Tabelle, Hinweisbox, Vor-/Nachteile, CTA, FAQ-Eintrag, Link-Ziel.
 */
import { defineArrayMember, defineField, defineType } from 'sanity'
import { BlockElementIcon } from '@sanity/icons/BlockElement'
import { BulbOutlineIcon } from '@sanity/icons/BulbOutline'
import { ImageIcon } from '@sanity/icons/Image'
import { LaunchIcon } from '@sanity/icons/Launch'
import { LinkIcon } from '@sanity/icons/Link'
import { BookIcon } from '@sanity/icons/Book'
import { HelpCircleIcon } from '@sanity/icons/HelpCircle'
import { ThListIcon } from '@sanity/icons/ThList'
import { ThumbsUpIcon } from '@sanity/icons/ThumbsUp'
import { sameLanguageFilter } from '../shared'

/** Typen, auf die intern verlinkt werden kann */
export const linkableTypes = ['article', 'landingPage', 'page', 'glossaryTerm', 'comparison', 'review']

/** Pflicht-Alt-Text, sobald ein Bild gesetzt ist */
const altField = defineField({
  name: 'alt',
  title: 'Alt-Text',
  type: 'string',
  description: 'Beschreibt das Bild für Screenreader und Suchmaschinen. Pflicht.',
  validation: (rule) =>
    rule.custom((alt, ctx) => {
      const parent = ctx.parent as { asset?: unknown } | undefined
      if (parent?.asset && !alt?.trim()) return 'Alt-Text ist Pflicht.'
      return true
    }),
})

/** Bild mit Alt-Text und optionaler Bildunterschrift (auch als Titelbild genutzt) */
export const figure = defineType({
  name: 'figure',
  title: 'Bild',
  type: 'image',
  icon: ImageIcon,
  options: { hotspot: true },
  fields: [
    altField,
    defineField({ name: 'caption', title: 'Bildunterschrift', type: 'string' }),
    defineField({ name: 'credit', title: 'Bildnachweis', type: 'string' }),
  ],
})

const linkAnnotation = defineArrayMember({
  name: 'link',
  title: 'Externer Link',
  type: 'object',
  icon: LaunchIcon,
  fields: [
    defineField({
      name: 'href',
      title: 'URL',
      type: 'url',
      validation: (rule) => rule.required().uri({ scheme: ['https', 'http', 'mailto', 'tel'] }),
    }),
    defineField({ name: 'nofollow', title: 'nofollow / sponsored', type: 'boolean', initialValue: false }),
  ],
})

const internalLinkAnnotation = defineArrayMember({
  name: 'internalLink',
  title: 'Interner Link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'reference',
      title: 'Ziel',
      type: 'reference',
      to: linkableTypes.map((type) => ({ type })),
      options: { filter: sameLanguageFilter },
      validation: (rule) => rule.required(),
    }),
  ],
})

const glossaryAnnotation = defineArrayMember({
  name: 'glossaryLink',
  title: 'Glossar-Begriff',
  type: 'object',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'term',
      title: 'Begriff',
      type: 'reference',
      to: [{ type: 'glossaryTerm' }],
      options: { filter: sameLanguageFilter },
      validation: (rule) => rule.required(),
    }),
  ],
})

/** Einfacher Text: Absätze, Listen, Fett/Kursiv, Links (für Hinweisboxen, FAQ-Antworten …) */
export const simpleText = defineType({
  name: 'simpleText',
  title: 'Einfacher Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Normal', value: 'normal' }],
      lists: [
        { title: 'Aufzählung', value: 'bullet' },
        { title: 'Nummeriert', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Fett', value: 'strong' },
          { title: 'Kursiv', value: 'em' },
        ],
        annotations: [linkAnnotation, internalLinkAnnotation, glossaryAnnotation],
      },
    }),
  ],
})

/** Linkziel: intern (Referenz) oder extern (URL) – genau eins von beiden */
export const linkTarget = defineType({
  name: 'linkTarget',
  title: 'Link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({ name: 'label', title: 'Beschriftung', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'internal',
      title: 'Interne Seite',
      type: 'reference',
      to: [...linkableTypes, 'category', 'author'].map((type) => ({ type })),
      options: { filter: sameLanguageFilter },
    }),
    defineField({
      name: 'external',
      title: 'Externe URL',
      type: 'url',
      description: 'Nur wenn keine interne Seite gewählt ist. Auch Pfade wie /glossar/ sind möglich.',
      validation: (rule) => rule.uri({ scheme: ['https', 'http', 'mailto'], allowRelative: true }),
    }),
  ],
  validation: (rule) =>
    rule.custom((value) => {
      const v = value as { internal?: unknown; external?: string } | undefined
      if (!v) return true
      if (v.internal && v.external) return 'Entweder interne Seite oder externe URL – nicht beides.'
      if (!v.internal && !v.external) return 'Bitte ein Linkziel angeben.'
      return true
    }),
  preview: {
    select: { title: 'label', internal: 'internal.title', term: 'internal.term', external: 'external' },
    prepare: ({ title, internal, term, external }) => ({
      title,
      subtitle: internal ?? term ?? external,
    }),
  },
})

/** Tabelle: Zeilen aus Zellen (Text) */
export const table = defineType({
  name: 'table',
  title: 'Tabelle',
  type: 'object',
  icon: ThListIcon,
  fields: [
    defineField({ name: 'caption', title: 'Tabellenbeschriftung', type: 'string', description: 'Empfohlen (Barrierefreiheit).' }),
    defineField({ name: 'headerRow', title: 'Erste Zeile ist Kopfzeile', type: 'boolean', initialValue: true }),
    defineField({ name: 'headerColumn', title: 'Erste Spalte ist Kopfspalte', type: 'boolean', initialValue: false }),
    defineField({
      name: 'rows',
      title: 'Zeilen',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'tableRow',
          title: 'Zeile',
          type: 'object',
          fields: [
            defineField({ name: 'cells', title: 'Zellen', type: 'array', of: [{ type: 'string' }] }),
          ],
          preview: {
            select: { cells: 'cells' },
            prepare: ({ cells }) => ({ title: ((cells as string[] | undefined) ?? []).join(' | ') }),
          },
        }),
      ],
      validation: (rule) =>
        rule.required().min(2).custom((rows) => {
          const lengths = new Set((rows as { cells?: string[] }[] | undefined)?.map((r) => r.cells?.length ?? 0))
          return lengths.size > 1 ? 'Alle Zeilen müssen gleich viele Zellen haben.' : true
        }),
    }),
  ],
  preview: {
    select: { caption: 'caption', rows: 'rows' },
    prepare: ({ caption, rows }) => ({
      title: caption || 'Tabelle',
      subtitle: `${(rows as unknown[] | undefined)?.length ?? 0} Zeilen`,
      media: ThListIcon,
    }),
  },
})

/** Hinweisbox */
export const callout = defineType({
  name: 'callout',
  title: 'Hinweisbox',
  type: 'object',
  icon: BulbOutlineIcon,
  fields: [
    defineField({
      name: 'tone',
      title: 'Art',
      type: 'string',
      options: {
        list: [
          { title: 'Info', value: 'info' },
          { title: 'Tipp', value: 'tip' },
          { title: 'Warnung', value: 'warning' },
          { title: 'Wichtig / Fazit', value: 'key' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'info',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'title', title: 'Überschrift', type: 'string' }),
    defineField({ name: 'body', title: 'Text', type: 'simpleText', validation: (rule) => rule.required() }),
  ],
  preview: {
    select: { title: 'title', tone: 'tone' },
    prepare: ({ title, tone }) => ({ title: title || 'Hinweisbox', subtitle: tone, media: BulbOutlineIcon }),
  },
})

/** Vor- und Nachteile */
export const prosCons = defineType({
  name: 'prosCons',
  title: 'Vor- und Nachteile',
  type: 'object',
  icon: ThumbsUpIcon,
  fields: [
    defineField({ name: 'title', title: 'Überschrift (optional)', type: 'string' }),
    defineField({
      name: 'pros',
      title: 'Vorteile',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'cons',
      title: 'Nachteile',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: 'title', pros: 'pros', cons: 'cons' },
    prepare: ({ title, pros, cons }) => ({
      title: title || 'Vor- und Nachteile',
      subtitle: `${(pros as unknown[] | undefined)?.length ?? 0} Pro · ${(cons as unknown[] | undefined)?.length ?? 0} Contra`,
    }),
  },
})

/** Call to Action */
export const cta = defineType({
  name: 'cta',
  title: 'Call to Action',
  type: 'object',
  icon: BlockElementIcon,
  fields: [
    defineField({ name: 'title', title: 'Überschrift', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'text', title: 'Text', type: 'text', rows: 2 }),
    defineField({ name: 'link', title: 'Button', type: 'linkTarget', validation: (rule) => rule.required() }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'link.label' },
    prepare: ({ title, subtitle }) => ({ title, subtitle: `CTA · ${subtitle ?? ''}`, media: BlockElementIcon }),
  },
})

/** FAQ-Eintrag */
export const faqItem = defineType({
  name: 'faqItem',
  title: 'Frage',
  type: 'object',
  icon: HelpCircleIcon,
  fields: [
    defineField({ name: 'question', title: 'Frage', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'answer', title: 'Antwort', type: 'simpleText', validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: 'question' } },
})

/** Haupt-Fließtext für Artikel, Glossar, Seiten usw. */
export const richText = defineType({
  name: 'richText',
  title: 'Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Überschrift H2', value: 'h2' },
        { title: 'Überschrift H3', value: 'h3' },
        { title: 'Überschrift H4', value: 'h4' },
        { title: 'Zitat', value: 'blockquote' },
      ],
      lists: [
        { title: 'Aufzählung', value: 'bullet' },
        { title: 'Nummeriert', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Fett', value: 'strong' },
          { title: 'Kursiv', value: 'em' },
          { title: 'Code', value: 'code' },
        ],
        annotations: [linkAnnotation, internalLinkAnnotation, glossaryAnnotation],
      },
    }),
    defineArrayMember({ type: 'figure' }),
    defineArrayMember({ type: 'table' }),
    defineArrayMember({ type: 'callout' }),
    defineArrayMember({ type: 'prosCons' }),
    defineArrayMember({ type: 'cta' }),
  ],
})
