/**
 * Modulare Abschnitte für Landingpages.
 * Jeder Abschnitt hat eine eigene Frontend-Komponente (web/src/components/sections/).
 */
import { defineArrayMember, defineField, defineType } from 'sanity'
import { BlockContentIcon } from '@sanity/icons/BlockContent'
import { BlockElementIcon } from '@sanity/icons/BlockElement'
import { CheckmarkCircleIcon } from '@sanity/icons/CheckmarkCircle'
import { HelpCircleIcon } from '@sanity/icons/HelpCircle'
import { StarIcon } from '@sanity/icons/Star'

export const heroSection = defineType({
  name: 'heroSection',
  title: 'Hero',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({ name: 'eyebrow', title: 'Dachzeile', type: 'string' }),
    defineField({ name: 'title', title: 'Überschrift (H1)', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }),
    defineField({ name: 'image', title: 'Bild', type: 'figure' }),
    defineField({ name: 'link', title: 'Button', type: 'linkTarget' }),
  ],
  preview: {
    select: { title: 'title', media: 'image' },
    prepare: ({ title, media }) => ({ title, subtitle: 'Hero', media }),
  },
})

export const textSection = defineType({
  name: 'textSection',
  title: 'Text',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    defineField({ name: 'title', title: 'Überschrift (H2)', type: 'string' }),
    defineField({ name: 'body', title: 'Text', type: 'richText', validation: (rule) => rule.required() }),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: title || 'Textabschnitt', subtitle: 'Text' }),
  },
})

export const benefitsSection = defineType({
  name: 'benefitsSection',
  title: 'Vorteile',
  type: 'object',
  icon: CheckmarkCircleIcon,
  fields: [
    defineField({ name: 'title', title: 'Überschrift (H2)', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'intro', title: 'Einleitung', type: 'text', rows: 2 }),
    defineField({
      name: 'items',
      title: 'Vorteile',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'benefit',
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Titel', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'text', title: 'Text', type: 'text', rows: 2 }),
          ],
        }),
      ],
      validation: (rule) => rule.required().min(2),
    }),
  ],
  preview: {
    select: { title: 'title', items: 'items' },
    prepare: ({ title, items }) => ({
      title,
      subtitle: `Vorteile · ${(items as unknown[] | undefined)?.length ?? 0} Einträge`,
    }),
  },
})

export const ctaSection = defineType({
  name: 'ctaSection',
  title: 'Call to Action',
  type: 'object',
  icon: BlockElementIcon,
  fields: [
    defineField({ name: 'title', title: 'Überschrift (H2)', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'text', title: 'Text', type: 'text', rows: 2 }),
    defineField({ name: 'link', title: 'Button', type: 'linkTarget', validation: (rule) => rule.required() }),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title, subtitle: 'Call to Action' }),
  },
})

export const faqSection = defineType({
  name: 'faqSection',
  title: 'FAQ',
  type: 'object',
  icon: HelpCircleIcon,
  description: 'Fragen erscheinen als Akkordeon und fließen ins FAQPage-Schema der Seite ein.',
  fields: [
    defineField({ name: 'title', title: 'Überschrift (H2)', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Fragen',
      type: 'array',
      of: [{ type: 'faqItem' }],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: 'title', items: 'items' },
    prepare: ({ title, items }) => ({
      title: title || 'FAQ',
      subtitle: `FAQ · ${(items as unknown[] | undefined)?.length ?? 0} Fragen`,
    }),
  },
})

export const landingSections = ['heroSection', 'textSection', 'benefitsSection', 'ctaSection', 'faqSection']
