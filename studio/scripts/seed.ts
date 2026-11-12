/**
 * Legt Grunddaten an (idempotent – bestehende Dokumente werden nicht überschrieben):
 * Kategorien und das Einstellungs-Dokument.
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

const result = await tx.commit()
console.log(`Fertig: ${result.results.length} Dokumente geprüft/angelegt.`)
