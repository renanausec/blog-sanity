/**
 * Zentrale Blog-Konfiguration.
 *
 * Alles, was diesen Blog von einer Kopie unterscheidet, steht hier (oder in .env).
 * Beim Anlegen eines neuen Blogs aus dieser Vorlage wird nur diese Datei angepasst –
 * plus das Theme in web/src/themes/ und die Umgebungsvariablen.
 *
 * Wird sowohl vom Studio (studio/) als auch vom Frontend (web/) importiert.
 * Achtung: Diese Datei darf keine Geheimnisse enthalten (Tokens gehören in .env).
 */

export type LocaleId = 'de' | 'en'

export interface LocaleDefinition {
  /** Interne ID, gleichzeitig Wert des Feldes `language` in Sanity */
  id: LocaleId
  /** Anzeigename im Studio und im Sprachumschalter */
  title: string
  /** Wert für <html lang> und hreflang */
  hreflang: string
  /** Wert für og:locale */
  ogLocale: string
}

export const siteConfig = {
  /** Name des Blogs (Fallback, falls in den Sanity-Einstellungen nichts gepflegt ist) */
  name: 'Tekpixo',

  /** Produktive Basis-URL ohne abschließenden Slash */
  url: 'https://tekpixo.com',

  /** Kurzbeschreibung je Sprache (Fallback für Startseite, RSS, llms.txt) */
  description: {
    de: 'Tekpixo erklärt Business-Software verständlich: ERP, CRM, Marketing-Tools, KI und Cyber Security – mit Vergleichen, Tests und Glossar.',
    en: 'Tekpixo explains business software in plain language: ERP, CRM, marketing tools, AI and cyber security – with comparisons, reviews and a glossary.',
  } satisfies Record<LocaleId, string>,

  /**
   * „Über uns“-Text je Sprache (Fallback, falls in Sanity → Einstellungen → Organisation nichts steht).
   * Wird im Footer und als Organization.description ausgegeben – für GEO wichtig:
   * Wer steht dahinter, welche Themen, für wen, wie wird gearbeitet.
   */
  about: {
    de: 'Tekpixo ist ein unabhängiges Online-Magazin für Business-Software. Wir erklären ERP- und CRM-Systeme, Marketing-Software, künstliche Intelligenz (KI) und Cyber Security verständlich – mit Ratgebern, Vergleichen, Testberichten und einem Fachglossar für Entscheider in kleinen und mittleren Unternehmen. Unsere Inhalte stützen sich auf überprüfbare Quellen und werden regelmäßig aktualisiert.',
    en: 'Tekpixo is an independent online magazine about business software. We explain ERP and CRM systems, marketing software, artificial intelligence (AI) and cyber security in plain language – with guides, comparisons, reviews and a glossary for decision-makers in small and mid-sized companies. Our content is based on verifiable sources and updated regularly.',
  } satisfies Record<LocaleId, string>,

  /**
   * Sprachen. Die erste ist die Hauptsprache: Sie liegt ohne Präfix im Wurzelverzeichnis (/)
   * und ist das Ziel von hreflang="x-default". Alle weiteren Sprachen erhalten ein Präfix (/en/).
   */
  locales: [
    { id: 'de', title: 'Deutsch', hreflang: 'de', ogLocale: 'de_DE' },
    { id: 'en', title: 'English', hreflang: 'en', ogLocale: 'en_US' },
  ] satisfies LocaleDefinition[],

  /** Sanity-Projekt. Project ID und Dataset sind nicht geheim, erscheinen aber nie im HTML. */
  sanity: {
    projectId: 'u9pdnj82',
    dataset: 'production',
    apiVersion: '2026-11-01',
    /** Hostname des gehosteten Studios: https://<studioHost>.sanity.studio */
    studioHost: 'tekpixo',
    /** Wird beim ersten `npm run studio:deploy` ausgegeben. Bei einem neuen Blog zunächst leer lassen. */
    studioAppId: 'kqz8ipfflg72dkrhuafjt94b',
  },

  /**
   * URL-Segmente je Sprache. Artikel, Landingpages und Seiten liegen direkt unter
   * der Sprachwurzel (/<slug>/ bzw. /en/<slug>/) – diese Segmente sind dort als Slug gesperrt.
   */
  routes: {
    category: { de: 'kategorie', en: 'category' },
    glossary: { de: 'glossar', en: 'glossary' },
    comparison: { de: 'vergleich', en: 'comparison' },
    review: { de: 'test', en: 'review' },
    author: { de: 'autor', en: 'author' },
    pagination: { de: 'seite', en: 'page' },
  } satisfies Record<string, Record<LocaleId, string>>,

  /** Aktives Theme (Ordnername in web/src/themes/) */
  theme: 'pixel',

  /** Einträge pro Seite in Listen (Startseite, Kategorien, Autoren) */
  pageSize: 12,

  /** Profile für schema.org `sameAs` und Footer-Icons. Leere Werte werden ignoriert. */
  social: {
    linkedin: '',
    x: '',
    facebook: '',
    instagram: '',
    youtube: '',
    github: '',
  },

  /**
   * Google AdSense – technischer Hauptschalter.
   * Nur wenn hier `enabled: true` steht UND in den Sanity-Einstellungen AdSense aktiviert ist,
   * wird das Skript geladen. Für die EU wird zusätzlich ein TCF-zertifiziertes Consent-Tool benötigt.
   */
  adsense: {
    enabled: false,
  },
} as const

export type SiteConfig = typeof siteConfig
export const defaultLocale: LocaleId = siteConfig.locales[0].id
export const localeIds = siteConfig.locales.map((l) => l.id) as LocaleId[]
