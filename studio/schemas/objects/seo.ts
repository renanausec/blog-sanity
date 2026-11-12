import { defineField, defineType } from 'sanity'
import { SearchIcon } from '@sanity/icons/Search'
import { charCountInput } from '../../components/CharCountInput'

/**
 * Wiederverwendbares SEO-Objekt für alle Inhaltsdokumente.
 * Leere Felder fallen im Frontend auf sinnvolle Standardwerte zurück
 * (Titel → Meta-Title, Kurzantwort → Meta-Description, Titelbild → OG-Bild).
 */
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  icon: SearchIcon,
  options: { collapsible: true, collapsed: false },
  fieldsets: [
    { name: 'robots', title: 'Robots', options: { columns: 2 } },
    { name: 'og', title: 'Open Graph (Social Media)', options: { collapsible: true, collapsed: true } },
    { name: 'sitemap', title: 'Sitemap', options: { columns: 2, collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta-Title',
      type: 'string',
      description: 'Leer = Seitentitel. Der Blogname wird automatisch angehängt.',
      components: { input: charCountInput(30, 60) },
      validation: (rule) => rule.max(70).warning('Über 70 Zeichen wird in Google meist abgeschnitten.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta-Description',
      type: 'text',
      rows: 3,
      description: 'Leer = Kurzantwort.',
      components: { input: charCountInput(120, 160) },
      validation: (rule) => [
        rule.min(70).warning('Kürzer als 70 Zeichen – Google ergänzt dann oft selbst.'),
        rule.max(170).warning('Über ~160 Zeichen wird meist abgeschnitten.'),
      ],
    }),
    defineField({
      name: 'canonical',
      title: 'Canonical-URL',
      type: 'url',
      description: 'Nur setzen, wenn der Inhalt eigentlich woanders „zu Hause“ ist. Leer = eigene URL.',
      validation: (rule) => rule.uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'noIndex',
      title: 'noindex',
      type: 'boolean',
      fieldset: 'robots',
      description: 'Seite nicht indexieren (fällt auch aus Sitemap, RSS und llms.txt).',
      initialValue: false,
    }),
    defineField({
      name: 'noFollow',
      title: 'nofollow',
      type: 'boolean',
      fieldset: 'robots',
      description: 'Links auf dieser Seite nicht folgen.',
      initialValue: false,
    }),
    defineField({
      name: 'ogTitle',
      title: 'OG-Titel',
      type: 'string',
      fieldset: 'og',
      description: 'Leer = Meta-Title.',
      validation: (rule) => rule.max(90).warning('Kürzer ist besser.'),
    }),
    defineField({
      name: 'ogDescription',
      title: 'OG-Beschreibung',
      type: 'text',
      rows: 2,
      fieldset: 'og',
      description: 'Leer = Meta-Description.',
      validation: (rule) => rule.max(200).warning('Kürzer ist besser.'),
    }),
    defineField({
      name: 'ogImage',
      title: 'OG-Bild',
      type: 'image',
      fieldset: 'og',
      description: 'Ideal 1200 × 630 px. Leer = Titelbild bzw. Standardbild aus den Einstellungen.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'sitemapPriority',
      title: 'Priorität',
      type: 'number',
      fieldset: 'sitemap',
      description: 'Leer = Standard je Inhaltstyp.',
      options: { list: [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1] },
    }),
    defineField({
      name: 'sitemapChangefreq',
      title: 'Änderungsfrequenz',
      type: 'string',
      fieldset: 'sitemap',
      description: 'Leer = Standard je Inhaltstyp.',
      options: { list: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'] },
    }),
  ],
})
