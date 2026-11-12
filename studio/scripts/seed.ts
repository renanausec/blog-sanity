/**
 * Legt Grunddaten an (idempotent – bestehende Dokumente werden nicht überschrieben):
 * Kategorien, Einstellungs-Dokument und Kontaktseite (DE/EN, verbunden und in den Einstellungen verknüpft).
 *
 * Ausführen:  npm run seed -w studio
 * (nutzt den Login des Sanity-CLI, kein Token nötig)
 */
import { getCliClient } from 'sanity/cli'
import { siteConfig } from '../../site.config'

const client = getCliClient({ apiVersion: siteConfig.sanity.apiVersion })

/** Kategorien dieses Blogs – beim Kopieren der Vorlage anpassen */
const categories = [
  { id: 'crm', de: 'CRM', en: 'CRM', order: 10 },
  { id: 'erp', de: 'ERP', en: 'ERP', order: 20 },
  { id: 'marketing', de: 'Marketing', en: 'Marketing', order: 30 },
  { id: 'ai', de: 'KI', en: 'AI', slugDe: 'ki', slugEn: 'ai', order: 40 },
  { id: 'cyber-security', de: 'Cyber Security', en: 'Cyber Security', order: 50 },
]

const tx = client.transaction()

for (const c of categories) {
  tx.createIfNotExists({
    _id: `category-${c.id}`,
    _type: 'category',
    title: { _type: 'localeString', de: c.de, en: c.en },
    slug: {
      _type: 'localeSlug',
      de: { _type: 'slug', current: c.slugDe ?? c.id },
      en: { _type: 'slug', current: c.slugEn ?? c.id },
    },
    order: c.order,
    noIndex: false,
  })
}

tx.createIfNotExists({
  _id: 'siteSettings',
  _type: 'siteSettings',
  siteName: siteConfig.name,
  showCategoriesInNav: true,
  organization: { legalName: siteConfig.name, country: 'DE' },
  adsense: { enabled: false },
})

// Kontaktseite je Sprache (E-Mail kommt aus Einstellungen → Organisation)
const block = (key: string, text: string) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}s`, text, marks: [] }],
})
const contactPages = {
  de: {
    title: 'Kontakt',
    slug: 'kontakt',
    intro: `Fragen, Hinweise oder Korrekturvorschläge zu unseren Inhalten? Schreiben Sie der Redaktion von ${siteConfig.name}.`,
    body: [
      block('c1', 'Wir freuen uns über Feedback zu unseren Ratgebern, Vergleichen und Testberichten.'),
      block('c2', 'Wenn Sie einen Fehler entdeckt haben, nennen Sie uns bitte die betroffene Seite – wir prüfen jeden Hinweis und korrigieren Inhalte bei Bedarf.'),
    ],
    metaDescription: `Kontakt zur Redaktion von ${siteConfig.name}: Fragen, Feedback und Korrekturhinweise zu unseren Artikeln, Vergleichen und Tests.`,
  },
  en: {
    title: 'Contact',
    slug: 'contact',
    intro: `Questions, feedback or corrections regarding our content? Write to the ${siteConfig.name} editorial team.`,
    body: [
      block('c1', 'We welcome feedback on our guides, comparisons and reviews.'),
      block('c2', 'If you spot an error, please tell us which page it concerns – we review every report and correct content where needed.'),
    ],
    metaDescription: `Contact the ${siteConfig.name} editorial team: questions, feedback and corrections for our articles, comparisons and reviews.`,
  },
} as const

for (const l of siteConfig.locales) {
  const c = contactPages[l.id as keyof typeof contactPages]
  if (!c) continue
  tx.createIfNotExists({
    _id: `page-contact-${l.id}`,
    _type: 'page',
    language: l.id,
    pageType: 'contact',
    title: c.title,
    slug: { _type: 'slug', current: c.slug },
    intro: c.intro,
    body: c.body,
    seo: { _type: 'seo', metaDescription: c.metaDescription, sitemapPriority: 0.3, sitemapChangefreq: 'yearly' },
  })
}
tx.createIfNotExists({
  _id: 'translation.metadata.page-contact',
  _type: 'translation.metadata',
  schemaTypes: ['page'],
  translations: siteConfig.locales
    .filter((l) => l.id in contactPages)
    .map((l) => ({
      _key: l.id,
      _type: 'internationalizedArrayReferenceValue',
      language: l.id,
      value: { _type: 'reference', _ref: `page-contact-${l.id}` },
    })),
})

const result = await tx.commit()

// Kontaktseiten in den Einstellungen verknüpfen (nur wenn noch nichts gesetzt ist)
const settingsPatch = client.patch('siteSettings').setIfMissing({ legalPages: {} })
for (const l of siteConfig.locales) {
  if (!(l.id in contactPages)) continue
  settingsPatch.setIfMissing({ [`legalPages.${l.id}`]: {} })
  settingsPatch.setIfMissing({ [`legalPages.${l.id}.contact`]: { _type: 'reference', _ref: `page-contact-${l.id}` } })
}
await settingsPatch.commit()
console.log(`Fertig: ${result.results.length} Dokumente geprüft/angelegt.`)
