/**
 * Demo-Inhalte zum Testen des Frontends (alle IDs beginnen mit "demo-").
 * Fiktive Produkte und Personen – vor dem Livegang wieder entfernen.
 *
 *   Anlegen:   npm run demo -w studio
 *   Entfernen: npm run demo:remove -w studio
 */
import { getCliClient } from 'sanity/cli'
import sharp from 'sharp'
import { siteConfig } from '../../site.config'

const client = getCliClient({ apiVersion: siteConfig.sanity.apiVersion })
const remove = process.argv.includes('--remove')

if (remove) {
  const ids = await client.fetch<string[]>(`*[_id match "demo-*" || _id match "drafts.demo-*"]._id`)
  const assets = await client.fetch<string[]>(`*[_type == "sanity.imageAsset" && originalFilename match "demo-*"]._id`)
  const tx = client.transaction()
  // Metadaten zuerst (referenzieren die Dokumente)
  ids.sort((a, b) => Number(b.includes('-tm-')) - Number(a.includes('-tm-'))).forEach((id) => tx.delete(id))
  await tx.commit()
  if (assets.length) {
    const atx = client.transaction()
    assets.forEach((id) => atx.delete(id))
    await atx.commit().catch(() => console.warn('Einige Bilder werden noch referenziert und bleiben erhalten.'))
  }
  console.log(`Entfernt: ${ids.length} Dokumente, ${assets.length} Bilder.`)
  process.exit(0)
}

// ── Hilfsfunktionen ─────────────────────────────────────────
let k = 0
const key = () => `k${(k++).toString(36)}`
const span = (text: string, marks: string[] = []) => ({ _type: 'span', _key: key(), text, marks })
const p = (...children: ReturnType<typeof span>[]) => ({ _type: 'block', _key: key(), style: 'normal', markDefs: [], children })
const h = (style: 'h2' | 'h3', text: string) => ({ _type: 'block', _key: key(), style, markDefs: [], children: [span(text)] })
const li = (text: string, list: 'bullet' | 'number' = 'bullet') => ({
  _type: 'block', _key: key(), style: 'normal', listItem: list, level: 1, markDefs: [], children: [span(text)],
})
const ref = (id: string) => ({ _type: 'reference', _ref: id })
const slug = (current: string) => ({ _type: 'slug', current })
const faq = (q: string, a: string) => ({ _type: 'faqItem', _key: key(), question: q, answer: [p(span(a))] })

async function uploadImage(name: string, title: string, colors: [string, string]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    <g fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2">${Array.from({ length: 12 }, (_, i) => `<circle cx="${1200 + i * 8}" cy="${200 + i * 30}" r="${80 + i * 40}"/>`).join('')}</g>
    <text x="100" y="780" font-family="Arial, sans-serif" font-size="96" font-weight="700" fill="#fff">${title}</text>
  </svg>`
  const png = await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer()
  const asset = await client.assets.upload('image', png, { filename: `demo-${name}.jpg` })
  return asset._id
}

const image = (assetId: string, alt: string, caption?: string) => ({
  _type: 'figure', asset: ref(assetId), alt, ...(caption ? { caption } : {}),
})

const translation = (id: string, type: string, de: string, en: string) => ({
  _id: `demo-tm-${id}`,
  _type: 'translation.metadata',
  schemaTypes: [type],
  translations: [
    { _key: key(), _type: 'internationalizedArrayReferenceValue', language: 'de', value: ref(de) },
    { _key: key(), _type: 'internationalizedArrayReferenceValue', language: 'en', value: ref(en) },
  ],
})

// ── Bilder ──────────────────────────────────────────────────
console.log('Lade Demo-Bilder hoch …')
const [imgErp, imgCrm, imgReview, imgAuthor, imgAi] = await Promise.all([
  uploadImage('erp', 'ERP', ['#4e1272', '#9c27b0']),
  uploadImage('crm', 'CRM', ['#2a0a3a', '#6a1b9a']),
  uploadImage('review', 'Review', ['#6a1b9a', '#e0a100']),
  uploadImage('author', 'LH', ['#6a1b9a', '#2a0a3a']),
  uploadImage('ai', 'KI · AI', ['#1f6fb2', '#6a1b9a']),
])

const now = new Date()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString()

// ── Dokumente ───────────────────────────────────────────────
const author = {
  _id: 'demo-author-lena',
  _type: 'author',
  name: 'Lena Hoffmann (Demo)',
  slug: slug('lena-hoffmann'),
  image: image(imgAuthor, 'Porträt von Lena Hoffmann'),
  jobTitle: { _type: 'localeString', de: 'Redakteurin für Business-Software', en: 'Business software editor' },
  bio: {
    _type: 'localeText',
    de: 'Lena schreibt seit zehn Jahren über ERP- und CRM-Systeme für den Mittelstand. (Fiktive Demo-Person.)',
    en: 'Lena has been writing about ERP and CRM systems for SMEs for ten years. (Fictional demo person.)',
  },
  expertise: ['ERP', 'CRM', 'SaaS'],
}

const glossaryDe = {
  _id: 'demo-glossary-erp-de',
  _type: 'glossaryTerm',
  language: 'de',
  title: 'ERP',
  slug: slug('erp'),
  shortDefinition:
    'ERP (Enterprise Resource Planning) ist Software, die Kernprozesse wie Einkauf, Lager, Produktion, Vertrieb und Finanzen in einer gemeinsamen Datenbank bündelt.',
  body: [
    h('h2', 'Wofür braucht man ein ERP-System?'),
    p(span('Ein ERP-System ersetzt Insellösungen durch einen gemeinsamen Datenbestand. Bestellungen, Lagerbestände und Rechnungen greifen auf dieselben Stammdaten zu.')),
    li('Weniger doppelte Dateneingabe'),
    li('Echtzeit-Überblick über Bestände und Finanzen'),
    li('Standardisierte Prozesse'),
  ],
  faq: [faq('Ist ERP nur etwas für Konzerne?', 'Nein. Cloud-ERP-Systeme gibt es heute auch für kleine Unternehmen ab wenigen Nutzern.')],
}
const glossaryEn = {
  ...glossaryDe,
  _id: 'demo-glossary-erp-en',
  language: 'en',
  shortDefinition:
    'ERP (Enterprise Resource Planning) is software that combines core processes such as purchasing, inventory, production, sales and finance in a single shared database.',
  body: [
    h('h2', 'Why do companies need an ERP system?'),
    p(span('An ERP system replaces isolated tools with one shared data set. Orders, stock levels and invoices all use the same master data.')),
    li('Less duplicate data entry'),
    li('Real-time view of inventory and finances'),
    li('Standardised processes'),
  ],
  faq: [faq('Is ERP only for large enterprises?', 'No. Cloud ERP systems are now available for small businesses with just a few users.')],
}
const glossaryCrmDe = {
  _id: 'demo-glossary-crm-de',
  _type: 'glossaryTerm',
  language: 'de',
  title: 'CRM',
  slug: slug('crm'),
  shortDefinition:
    'CRM (Customer Relationship Management) bezeichnet Software und Methoden, mit denen Unternehmen Kundenkontakte, Verkaufschancen und Service-Anfragen zentral verwalten.',
  relatedTerms: [{ ...ref('demo-glossary-erp-de'), _key: key() }],
}

const articleBody = (lang: 'de' | 'en') => {
  const de = lang === 'de'
  const linkKey = key()
  return [
    {
      _type: 'block', _key: key(), style: 'normal',
      markDefs: [{ _type: 'glossaryLink', _key: linkKey, term: ref(de ? 'demo-glossary-erp-de' : 'demo-glossary-erp-en') }],
      children: [
        span(de ? 'Ein ' : 'An '),
        span('ERP-System', [linkKey]),
        span(de ? ' verbindet alle Abteilungen über eine gemeinsame Datenbasis. In diesem Ratgeber erfahren Sie, worauf es bei der Auswahl ankommt.' : ' connects every department through one shared data set. This guide explains what matters when choosing one.'),
      ],
    },
    h('h2', de ? 'Die wichtigsten Funktionen' : 'Key features'),
    li(de ? 'Finanzbuchhaltung und Controlling' : 'Accounting and controlling'),
    li(de ? 'Warenwirtschaft und Lager' : 'Inventory and warehousing'),
    li(de ? 'Einkauf und Vertrieb' : 'Purchasing and sales'),
    h('h2', de ? 'Cloud oder On-Premises?' : 'Cloud or on-premises?'),
    {
      _type: 'table', _key: key(), caption: de ? 'Cloud-ERP und On-Premises im Vergleich' : 'Cloud ERP vs. on-premises',
      headerRow: true, headerColumn: true,
      rows: [
        { _key: key(), _type: 'tableRow', cells: [de ? 'Kriterium' : 'Criterion', 'Cloud', 'On-Premises'] },
        { _key: key(), _type: 'tableRow', cells: [de ? 'Startkosten' : 'Upfront cost', de ? 'niedrig' : 'low', de ? 'hoch' : 'high'] },
        { _key: key(), _type: 'tableRow', cells: ['Updates', de ? 'automatisch' : 'automatic', de ? 'manuell' : 'manual'] },
        { _key: key(), _type: 'tableRow', cells: [de ? 'Anpassbarkeit' : 'Customisation', de ? 'mittel' : 'medium', de ? 'hoch' : 'high'] },
      ],
    },
    {
      _type: 'callout', _key: key(), tone: 'tip',
      body: [p(span(de ? 'Starten Sie mit einer Prozessanalyse, bevor Sie Anbieter vergleichen.' : 'Start with a process analysis before comparing vendors.'))],
    },
    h('h2', de ? 'Vor- und Nachteile' : 'Pros and cons'),
    {
      _type: 'prosCons', _key: key(),
      pros: de ? ['Eine Datenbasis für alle', 'Bessere Planbarkeit'] : ['One data set for everyone', 'Better planning'],
      cons: de ? ['Hoher Einführungsaufwand', 'Schulungsbedarf'] : ['Significant rollout effort', 'Training required'],
    },
    image(imgAi, de ? 'Abstrakte Grafik zu KI im ERP' : 'Abstract graphic about AI in ERP', de ? 'KI-Funktionen werden in ERP-Systemen Standard.' : 'AI features are becoming standard in ERP systems.'),
    h('h2', de ? 'Fazit' : 'Conclusion'),
    p(span(de ? 'Das passende ERP-System richtet sich nach Ihren Prozessen – nicht umgekehrt.' : 'The right ERP system fits your processes – not the other way round.')),
    {
      _type: 'cta', _key: key(), title: de ? 'Begriffe nachschlagen' : 'Look up terms',
      text: de ? 'Alle Fachbegriffe einfach erklärt.' : 'All technical terms explained simply.',
      link: { _type: 'linkTarget', label: de ? 'Zum Glossar' : 'Open glossary', external: de ? '/glossar/' : '/en/glossary/' },
    },
  ]
}

const articleDe = {
  _id: 'demo-article-erp-de',
  _type: 'article',
  language: 'de',
  title: 'ERP-System auswählen: Der Ratgeber für den Mittelstand',
  slug: slug('erp-system-auswaehlen'),
  excerpt:
    'Ein ERP-System bündelt Finanzen, Lager, Einkauf und Vertrieb in einer Datenbank. Für den Mittelstand zählen vor allem Prozess-Fit, Gesamtkosten über fünf Jahre und ein Anbieter mit Branchenerfahrung.',
  mainImage: image(imgErp, 'Grafik mit dem Schriftzug ERP auf violettem Verlauf'),
  authors: [{ ...ref(author._id), _key: key() }],
  category: ref('category-erp'),
  publishedAt: daysAgo(3),
  body: articleBody('de'),
  faq: [
    faq('Wie lange dauert eine ERP-Einführung?', 'Bei kleinen Unternehmen drei bis sechs Monate, bei größeren oft ein Jahr oder länger.'),
    faq('Was kostet ein ERP-System?', 'Cloud-Lösungen starten bei etwa 50 Euro pro Nutzer und Monat, hinzu kommen Einführungskosten.'),
  ],
  seo: { _type: 'seo', metaDescription: 'ERP-System auswählen: Funktionen, Kosten, Cloud vs. On-Premises und die wichtigsten Kriterien für den Mittelstand – kompakt erklärt.' },
}
const articleEn = {
  ...articleDe,
  _id: 'demo-article-erp-en',
  language: 'en',
  title: 'Choosing an ERP system: a guide for SMEs',
  slug: slug('choosing-an-erp-system'),
  excerpt:
    'An ERP system combines finance, inventory, purchasing and sales in one database. For SMEs, process fit, five-year total cost and a vendor with industry experience matter most.',
  mainImage: image(imgErp, 'Graphic with the word ERP on a purple gradient'),
  body: articleBody('en'),
  faq: [
    faq('How long does an ERP rollout take?', 'Three to six months for small companies, often a year or more for larger ones.'),
    faq('How much does an ERP system cost?', 'Cloud solutions start at around 50 euros per user per month, plus implementation costs.'),
  ],
  seo: { _type: 'seo', metaDescription: 'Choosing an ERP system: features, costs, cloud vs. on-premises and the key criteria for SMEs – explained concisely.' },
}

const review = {
  _id: 'demo-review-crm-de',
  _type: 'review',
  language: 'de',
  title: 'Beispiel-CRM Pro im Test: Solide für kleine Vertriebsteams',
  slug: slug('beispiel-crm-pro-test'),
  excerpt:
    'Beispiel-CRM Pro ist ein übersichtliches CRM für Teams bis 20 Personen. Stark bei Pipeline und E-Mail-Integration, schwächer bei Auswertungen. Unsere Bewertung: 4 von 5.',
  mainImage: image(imgReview, 'Grafik mit dem Schriftzug Review'),
  product: { _type: 'product', name: 'Beispiel-CRM Pro', brand: 'Demo GmbH', priceFrom: 15 },
  rating: 4,
  pros: ['Schnelle Einrichtung', 'Gute E-Mail-Integration', 'Faire Preise'],
  cons: ['Berichte nur eingeschränkt anpassbar', 'Keine Telefonie'],
  verdict: 'Für kleine Vertriebsteams ein guter Einstieg. Wer tiefe Auswertungen braucht, sollte Alternativen prüfen.',
  body: [h('h2', 'Einrichtung und Bedienung'), p(span('Die Einrichtung dauert unter einer Stunde. Kontakte lassen sich per CSV importieren.'))],
  authors: [{ ...ref(author._id), _key: key() }],
  category: ref('category-crm'),
  publishedAt: daysAgo(5),
}

const comparison = {
  _id: 'demo-comparison-crm-de',
  _type: 'comparison',
  language: 'de',
  title: 'Die 3 besten CRM-Systeme für kleine Unternehmen',
  slug: slug('beste-crm-systeme-kmu'),
  excerpt:
    'Für kleine Unternehmen eignen sich vor allem CRM-Systeme mit schneller Einrichtung und fairen Monatspreisen. Testsieger ist Beispiel-CRM Pro, Preis-Tipp ist Muster-CRM Light.',
  mainImage: image(imgCrm, 'Grafik mit dem Schriftzug CRM'),
  intro: [p(span('Wir haben drei fiktive CRM-Systeme nach Bedienung, Funktionen und Preis bewertet.'))],
  items: [
    { _type: 'comparisonItem', _key: key(), name: 'Beispiel-CRM Pro', badge: 'Testsieger', summary: 'Ausgewogenes Gesamtpaket für Vertriebsteams.', pros: ['Einfache Bedienung', 'Gute Integrationen'], cons: ['Begrenzte Berichte'], rating: 4, review: ref(review._id) },
    { _type: 'comparisonItem', _key: key(), name: 'Muster-CRM Light', badge: 'Preis-Tipp', summary: 'Günstiger Einstieg mit allen Grundfunktionen.', pros: ['Kostenloser Plan'], cons: ['Wenig Automatisierung'], rating: 3.5 },
    { _type: 'comparisonItem', _key: key(), name: 'Demo Sales Suite', summary: 'Mächtig, aber für kleine Teams oft überdimensioniert.', pros: ['Viele Funktionen'], cons: ['Teuer', 'Lange Einarbeitung'], rating: 3 },
  ],
  comparisonTable: {
    _type: 'table', caption: 'CRM-Systeme im Überblick', headerRow: true, headerColumn: true,
    rows: [
      { _key: key(), _type: 'tableRow', cells: ['Anbieter', 'Preis ab', 'Kostenloser Plan', 'Bewertung'] },
      { _key: key(), _type: 'tableRow', cells: ['Beispiel-CRM Pro', '15 €', 'Nein', '4,0'] },
      { _key: key(), _type: 'tableRow', cells: ['Muster-CRM Light', '0 €', 'Ja', '3,5'] },
      { _key: key(), _type: 'tableRow', cells: ['Demo Sales Suite', '49 €', 'Nein', '3,0'] },
    ],
  },
  authors: [{ ...ref(author._id), _key: key() }],
  category: ref('category-crm'),
  publishedAt: daysAgo(1),
  related: [{ ...ref(articleDe._id), _key: key() }, { ...ref(review._id), _key: key() }],
  faq: [faq('Welches CRM ist für Einsteiger am besten?', 'In unserem Vergleich Beispiel-CRM Pro – es ist schnell eingerichtet und leicht zu bedienen.')],
}

// Weitere Artikel für Listen/Paginierung
const fillers = Array.from({ length: 13 }, (_, i) => ({
  _id: `demo-article-filler-${i}`,
  _type: 'article',
  language: 'de',
  title: `Demo-Beitrag ${i + 1}: ${['KI im Marketing', 'Zero Trust erklärt', 'CRM-Daten pflegen', 'ERP-Migration planen'][i % 4]}`,
  slug: slug(`demo-beitrag-${i + 1}`),
  excerpt: 'Ein kurzer Demo-Beitrag, um Listen, Kategorien und die Paginierung mit genügend Inhalten zu testen.',
  mainImage: i % 3 === 0 ? image([imgAi, imgCrm, imgErp][i % 3], 'Demo-Grafik') : undefined,
  authors: [{ ...ref(author._id), _key: key() }],
  category: ref(['category-ai', 'category-cyber-security', 'category-crm', 'category-erp', 'category-marketing'][i % 5]),
  publishedAt: daysAgo(10 + i),
  body: [p(span('Demo-Text.'))],
}))

const tx = client.transaction()
for (const doc of [author, glossaryDe, glossaryEn, glossaryCrmDe, articleDe, articleEn, review, comparison, ...fillers]) {
  tx.createOrReplace(doc as never)
}
tx.createOrReplace(translation('glossary-erp', 'glossaryTerm', glossaryDe._id, glossaryEn._id) as never)
tx.createOrReplace(translation('article-erp', 'article', articleDe._id, articleEn._id) as never)
await tx.commit()
console.log('Demo-Inhalte angelegt.')
