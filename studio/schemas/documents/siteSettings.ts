/**
 * Singleton „Website-Einstellungen“ (Dokument-ID: siteSettings).
 * Sprachabhängige Bereiche (Navigation, Footer, Pflichtseiten) haben je Sprache ein Unterfeld.
 */
import { defineArrayMember, defineField, defineType } from 'sanity'
import { CogIcon } from '@sanity/icons/Cog'
import { siteConfig } from '../../../site.config'

/** Erzeugt ein Objekt mit einem Unterfeld je Sprache */
function perLocale(name: string, title: string, build: (lang: string) => ReturnType<typeof defineField>, group?: string) {
  return defineField({
    name,
    title,
    type: 'object',
    group,
    options: { collapsible: true, collapsed: false },
    fields: siteConfig.locales.map((l) => ({ ...build(l.id), name: l.id, title: l.title })),
  })
}

const legalRef = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'reference',
    to: [{ type: 'page' }],
    options: {
      filter: ({ parentPath }) => ({
        filter: 'language == $lang',
        params: { lang: parentPath[1] },
      }),
    },
  })

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Website-Einstellungen',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'general', title: 'Allgemein', default: true },
    { name: 'navigation', title: 'Navigation' },
    { name: 'footer', title: 'Footer & Pflichtseiten' },
    { name: 'organization', title: 'Organisation' },
    { name: 'ads', title: 'AdSense' },
  ],
  fields: [
    defineField({
      name: 'siteName',
      title: 'Name der Website',
      type: 'string',
      group: 'general',
      initialValue: siteConfig.name,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Claim',
      type: 'localeString',
      group: 'general',
      description: 'Kurzer Slogan unter dem Logo / auf der Startseite.',
    }),
    defineField({
      name: 'homeIntro',
      title: 'Startseite: Meta-Description',
      type: 'localeText',
      group: 'general',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'general',
      description: 'SVG oder PNG mit transparentem Hintergrund. Leer = Name als Text-Logo.',
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      group: 'general',
      description: 'Quadratisch, mind. 512 × 512 px (PNG). Daraus werden alle Größen erzeugt.',
    }),
    defineField({
      name: 'defaultOgImage',
      title: 'Standard-OG-Bild',
      type: 'image',
      group: 'general',
      description: '1200 × 630 px. Für Seiten ohne eigenes Bild.',
    }),

    perLocale(
      'mainNav',
      'Hauptnavigation',
      () => defineField({ name: 'x', type: 'array', of: [defineArrayMember({ type: 'linkTarget' })] }),
      'navigation',
    ),
    defineField({
      name: 'showCategoriesInNav',
      title: 'Kategorien automatisch in die Navigation aufnehmen',
      type: 'boolean',
      group: 'navigation',
      initialValue: true,
    }),

    perLocale(
      'footerText',
      'Footer-Text',
      () => defineField({ name: 'x', type: 'text', rows: 3 }),
      'footer',
    ),
    perLocale(
      'footerNav',
      'Footer-Links',
      () => defineField({ name: 'x', type: 'array', of: [defineArrayMember({ type: 'linkTarget' })] }),
      'footer',
    ),
    perLocale(
      'legalPages',
      'Pflicht- und Service-Seiten',
      () =>
        defineField({
          name: 'x',
          type: 'object',
          fields: [
            legalRef('imprint', 'Impressum'),
            legalRef('privacy', 'Datenschutz'),
            legalRef('editorialPolicy', 'Redaktionelle Richtlinien'),
            legalRef('contact', 'Kontakt'),
          ],
        }),
      'footer',
    ),

    defineField({
      name: 'organization',
      title: 'Herausgeber (schema.org Organization)',
      type: 'object',
      group: 'organization',
      fields: [
        defineField({ name: 'legalName', title: 'Rechtlicher Name', type: 'string' }),
        defineField({
          name: 'description',
          title: 'Wer wir sind',
          type: 'localeText',
          description:
            'Je Sprache 2–4 Sätze über das Projekt: Wer steht dahinter, welche Themen, für wen, wie wird gearbeitet (unabhängig, getestet, regelmäßig aktualisiert). Wird als Organization.description und im Footer genutzt – wichtig für GEO.',
        }),
        defineField({
          name: 'knowsAbout',
          title: 'Themengebiete',
          type: 'array',
          of: [{ type: 'string' }],
          options: { layout: 'tags' },
          description: 'Schlagworte für schema.org knowsAbout (z. B. ERP, CRM, Marketing-Automation, KI, Cyber Security).',
        }),
        defineField({ name: 'foundingDate', title: 'Gründungsdatum', type: 'date' }),
        defineField({
          name: 'email',
          title: 'Kontakt-E-Mail',
          type: 'email',
          description:
            'Zentrale Kontaktadresse. Erscheint automatisch auf der Kontaktseite (alle Sprachen), im Footer und im schema.org contactPoint. Nur hier ändern.',
        }),
        defineField({ name: 'streetAddress', title: 'Straße und Hausnummer', type: 'string' }),
        defineField({ name: 'postalCode', title: 'PLZ', type: 'string' }),
        defineField({ name: 'city', title: 'Ort', type: 'string' }),
        defineField({ name: 'country', title: 'Land (ISO-Code)', type: 'string', initialValue: 'DE' }),
      ],
    }),

    defineField({
      name: 'adsense',
      title: 'Google AdSense',
      type: 'object',
      group: 'ads',
      description: siteConfig.adsense.enabled
        ? 'AdSense ist in site.config.ts freigegeben.'
        : 'Hinweis: AdSense ist in site.config.ts technisch deaktiviert – diese Einstellungen haben derzeit keine Wirkung.',
      fields: [
        defineField({ name: 'enabled', title: 'Anzeigen aktivieren', type: 'boolean', initialValue: false }),
        defineField({
          name: 'clientId',
          title: 'Publisher-ID',
          type: 'string',
          description: 'Format: ca-pub-1234567890123456',
          hidden: ({ parent }) => !parent?.enabled,
          validation: (rule) =>
            rule.custom((value, ctx) => {
              const enabled = (ctx.parent as { enabled?: boolean } | undefined)?.enabled
              if (!enabled) return true
              if (!value) return 'Pflicht, wenn Anzeigen aktiv sind.'
              return /^ca-pub-\d{10,20}$/.test(value) ? true : 'Format: ca-pub-…'
            }),
        }),
        defineField({
          name: 'placements',
          title: 'Anzeigenplätze',
          type: 'object',
          hidden: ({ parent }) => !parent?.enabled,
          description: 'Slot-ID je Position. Leer = an dieser Stelle keine Anzeige.',
          fields: [
            defineField({ name: 'articleTop', title: 'Artikel: nach der Kurzantwort', type: 'string' }),
            defineField({ name: 'articleMiddle', title: 'Artikel: Mitte des Textes', type: 'string' }),
            defineField({ name: 'articleBottom', title: 'Artikel: nach dem Text', type: 'string' }),
            defineField({ name: 'listing', title: 'Listen: zwischen den Karten', type: 'string' }),
          ],
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Website-Einstellungen' }) },
})
