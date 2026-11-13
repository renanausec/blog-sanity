/**
 * Maschinenlesbare Ausgaben: RSS, XML-Sitemaps, robots.txt, llms.txt.
 * Alle basieren auf denselben Daten wie die HTML-Seiten.
 */
import { localeIds, siteConfig, type LocaleId } from '../../../site.config'
import { absoluteUrl, docPath } from '../../../shared/routing'
import { editorialFor, loadContent } from './content'
import { absoluteImage } from './images'
import { localeInfo, pick, t } from './i18n'
import { plain } from './jsonld'
import { getRoutes } from './routes'
import { isProductionBuild } from './env'
import type { ContentDoc, EditorialDoc } from './types'

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const xml = (body: string, type = 'application/xml') =>
  new Response(body, { headers: { 'Content-Type': `${type}; charset=utf-8` } })

const isPreview = () => !isProductionBuild

// ── RSS ─────────────────────────────────────────────────────

export async function rss(lang: LocaleId): Promise<Response> {
  const content = await loadContent()
  const s = t(lang)
  const siteName = content.settings.siteName || siteConfig.name
  const items = editorialFor(content, lang).slice(0, 30)
  const home = absoluteUrl(docPath('home', lang))
  const self = absoluteUrl(`${docPath('home', lang)}rss.xml`)

  const entries = await Promise.all(
    items.map(async (d) => {
      const url = absoluteUrl(docPath(d._type, d.language, d.slug))
      const image = await absoluteImage(d.mainImage)
      const category = d.category ? pick(d.category.title, lang) : undefined
      return `    <item>
      <title>${xmlEscape(d.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(d.publishedAt).toUTCString()}</pubDate>
      <description>${xmlEscape(d.excerpt ?? '')}</description>
${category ? `      <category>${xmlEscape(category)}</category>\n` : ''}${d.authors.map((a) => `      <dc:creator>${xmlEscape(a.name)}</dc:creator>\n`).join('')}${image ? `      <enclosure url="${image.url}" type="image/jpeg" length="0" />\n` : ''}    </item>`
    }),
  )

  return xml(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xmlEscape(siteName)}</title>
    <link>${home}</link>
    <description>${xmlEscape(siteConfig.description[lang])}</description>
    <language>${localeInfo(lang).hreflang}</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>${xmlEscape(siteName)} – ${xmlEscape(s.rss)}</generator>
${entries.join('\n')}
  </channel>
</rss>
`,
    'application/rss+xml',
  )
}

// ── Sitemaps ────────────────────────────────────────────────

export function sitemapIndex(): Response {
  const entries = localeIds
    .map((l) => `  <sitemap><loc>${absoluteUrl(`/sitemap-${l}.xml`)}</loc></sitemap>`)
    .join('\n')
  return xml(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`)
}

export async function sitemap(lang: LocaleId): Promise<Response> {
  const routes = (await getRoutes()).filter((r) => r.lang === lang && !r.noIndex && r.sitemap)
  const urls = routes
    .filter((r) => {
      // Seiten mit fremder Canonical gehören nicht in die Sitemap
      const doc = r.data.kind === 'doc' ? r.data.doc : undefined
      return !doc?.seo?.canonical || doc.seo.canonical === absoluteUrl(r.path)
    })
    .map((r) => {
      const alternates = Object.entries(r.alternates)
      const links =
        alternates.length > 1
          ? [
              ...alternates.map(
                ([l, p]) =>
                  `    <xhtml:link rel="alternate" hreflang="${localeInfo(l as LocaleId).hreflang}" href="${absoluteUrl(p!)}" />`,
              ),
              ...(r.alternates[siteConfig.locales[0].id]
                ? [`    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(r.alternates[siteConfig.locales[0].id]!)}" />`]
                : []),
            ].join('\n') + '\n'
          : ''
      return `  <url>
    <loc>${absoluteUrl(r.path)}</loc>
${r.lastmod ? `    <lastmod>${new Date(r.lastmod).toISOString()}</lastmod>\n` : ''}    <changefreq>${r.sitemap!.changefreq}</changefreq>
    <priority>${r.sitemap!.priority.toFixed(1)}</priority>
${links}  </url>`
    })
  return xml(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`)
}

// ── robots.txt ──────────────────────────────────────────────

export function robots(): Response {
  const body = isPreview()
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap-index.xml')}\n`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

// ── llms.txt (https://llmstxt.org) ──────────────────────────

function docUrl(d: Pick<ContentDoc, '_type' | 'language' | 'slug'>) {
  return absoluteUrl(docPath(d._type, d.language, d.slug))
}

function summary(d: ContentDoc): string {
  if ('excerpt' in d && d.excerpt) return d.excerpt
  if ('shortDefinition' in d && d.shortDefinition) return d.shortDefinition
  if ('intro' in d && typeof d.intro === 'string') return d.intro
  return ''
}

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()

export async function llmsTxt(): Promise<Response> {
  const content = await loadContent()
  const siteName = content.settings.siteName || siteConfig.name
  const lines: string[] = [`# ${siteName}`, '', `> ${siteConfig.description[siteConfig.locales[0].id]}`, '']
  const indexablePaths = new Set((await getRoutes()).filter((r) => !r.noIndex).map((r) => r.path))

  for (const lang of localeIds) {
    const s = t(lang)
    const indexable = <T extends ContentDoc>(docs: T[]) => docs.filter((d) => d.language === lang && !d.seo?.noIndex)
    const sections: [string, ContentDoc[]][] = [
      [lang === 'de' ? 'Artikel' : 'Articles', indexable(content.articles)],
      [lang === 'de' ? 'Vergleiche' : 'Comparisons', indexable(content.comparisons)],
      [lang === 'de' ? 'Tests' : 'Reviews', indexable(content.reviews)],
      [s.glossary, indexable(content.glossary)],
    ]
    // Übersichtsseiten nur, wenn sie indexierbar sind (leeres Glossar o. Ä. ist noindex)
    const hubs: [string, string][] = [
      [s.home, docPath('home', lang)],
      [s.topics, docPath('categoryIndex', lang)],
      [s.comparisons, docPath('comparisonIndex', lang)],
      [s.reviews, docPath('reviewIndex', lang)],
      [s.glossary, docPath('glossaryIndex', lang)],
      [s.authors, docPath('authorIndex', lang)],
    ]
    lines.push(`## ${localeInfo(lang).title}`, '')
    for (const [label, path] of hubs) if (indexablePaths.has(path)) lines.push(`- [${label}](${absoluteUrl(path)})`)
    lines.push('')
    for (const [title, docs] of sections) {
      if (!docs.length) continue
      lines.push(`### ${title}`, '')
      for (const d of docs) lines.push(`- [${d.title}](${docUrl(d)})${summary(d) ? `: ${oneLine(summary(d))}` : ''}`)
      lines.push('')
    }
  }

  const optional = [...content.pages, ...content.landingPages].filter((d) => !d.seo?.noIndex)
  if (optional.length) {
    lines.push('## Optional', '')
    for (const d of optional) lines.push(`- [${d.title}](${docUrl(d)})`)
    lines.push('')
  }
  lines.push(`Volltext: ${absoluteUrl('/llms-full.txt')}`, '')

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

/** Volltext aller indexierbaren Inhalte als Markdown – für LLM-Crawler */
export async function llmsFullTxt(): Promise<Response> {
  const content = await loadContent()
  const siteName = content.settings.siteName || siteConfig.name
  const out: string[] = [`# ${siteName}`, '', `> ${siteConfig.description[siteConfig.locales[0].id]}`, '']

  const editorial = (d: EditorialDoc) => {
    const parts = [`## ${d.title}`, '', `URL: ${docUrl(d)}`, `Sprache: ${d.language} · ${d.publishedAt.slice(0, 10)}`, '', d.excerpt]
    if (d._type === 'review') {
      const r = d as EditorialDoc & { rating: number; verdict: string; pros: string[]; cons: string[] }
      parts.push('', `Bewertung: ${r.rating}/5`, `Fazit: ${r.verdict}`, `Pro: ${(r.pros ?? []).join('; ')}`, `Contra: ${(r.cons ?? []).join('; ')}`)
    }
    if (d._type === 'comparison') {
      const c = d as EditorialDoc & { items: { name: string; summary: string; rating?: number }[] }
      parts.push('', ...(c.items ?? []).map((it, i) => `${i + 1}. ${it.name}${it.rating ? ` (${it.rating}/5)` : ''}: ${it.summary}`))
    }
    parts.push('', plain(d.body), '', ...(d.faq ?? []).flatMap((f) => [`**${f.question}** ${plain(f.answer)}`]), '')
    return parts.join('\n')
  }

  for (const lang of localeIds) {
    for (const d of editorialFor(content, lang)) out.push(editorial(d))
    for (const g of content.glossary.filter((g) => g.language === lang && !g.seo?.noIndex)) {
      out.push(`## ${g.title}`, '', `URL: ${docUrl(g)}`, '', g.shortDefinition, '', plain(g.body), '')
    }
  }
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
