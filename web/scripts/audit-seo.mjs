/**
 * Schneller SEO/GEO-Check des Builds (dist/): Title- und Description-Länge, genau eine H1,
 * Überschriften-Sprünge, Bilder ohne alt, kaputte interne Links, JSON-LD-Typen.
 *
 *   npm run build && npm run audit
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('../dist/', import.meta.url).pathname
const files = []
const walk = (d) => readdirSync(d).forEach((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith('.html') && files.push(join(d, f))))
walk(root)

const pages = new Map(files.map((f) => ['/' + relative(root, f).replace(/index\.html$/, ''), readFileSync(f, 'utf8')]))
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
let problems = 0

for (const [url, html] of [...pages].sort()) {
  if (url.includes('404')) continue
  const robots = html.match(/name="robots" content="([^"]*)"/)?.[1] ?? ''
  if (robots.startsWith('noindex') && !process.argv.includes('--all')) continue
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '')
  const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '')
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1])
  const flags = []
  if (title.length < 30 || title.length > 65) flags.push(`Title ${title.length} Zeichen`)
  if (desc.length < 70 || desc.length > 160) flags.push(`Description ${desc.length} Zeichen`)
  const h1 = levels.filter((l) => l === 1).length
  if (h1 !== 1) flags.push(`${h1}× H1`)
  const jump = levels.findIndex((l, i) => i > 0 && l > levels[i - 1] + 1)
  if (jump > 0) flags.push(`Sprung H${levels[jump - 1]}→H${levels[jump]}`)
  const noAlt = (html.match(/<img(?![^>]*\balt\b)[^>]*>/g) ?? []).length
  if (noAlt) flags.push(`${noAlt} Bild(er) ohne alt`)
  const broken = [...new Set([...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]))].filter(
    (l) => !l.startsWith('/_astro') && !pages.has(l) && !existsSync(join(root, l)),
  )
  if (broken.length) flags.push(`kaputte Links: ${broken.join(', ')}`)
  const types = new Set()
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const g = JSON.parse(m[1])
    ;(g['@graph'] ?? [g]).forEach((n) => types.add(n['@type']))
  }
  if (flags.length) problems++
  console.log(`${flags.length ? '⚠' : '✔'} ${url}${flags.length ? '  – ' + flags.join('; ') : ''}`)
  if (process.argv.includes('--verbose')) console.log(`    ${title}\n    JSON-LD: ${[...types].join(', ')}`)
}
console.log(`\n${problems ? `⚠ ${problems} Seite(n) mit Hinweisen` : '✔ Keine Auffälligkeiten'} (nur indexierbare Seiten; --all für alle)`)
