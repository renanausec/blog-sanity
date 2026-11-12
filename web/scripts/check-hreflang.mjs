/**
 * Prüft hreflang im Build (dist/):
 * - jede verlinkte Sprachversion existiert als Datei,
 * - die Zielseite verweist mit genau denselben hreflang-Paaren zurück (Wechselseitigkeit),
 * - jede Seite mit hreflang nennt sich selbst und hat x-default.
 * Bricht mit Exit-Code 1 ab, wenn etwas nicht stimmt.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist', import.meta.url))

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* htmlFiles(p)
    else if (name.endsWith('.html')) yield p
  }
}

const pathOf = (file) => file.slice(dist.length).replace(/index\.html$/, '')
const fileOf = (url) => {
  const path = new URL(url).pathname
  return join(dist, path.endsWith('/') ? `${path}index.html` : path)
}
const alternatesOf = (html) =>
  [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
    .map(([, lang, href]) => `${lang} ${href}`)
    .sort()
    .join('\n')

const errors = []
let checked = 0
for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8')
  const set = alternatesOf(html)
  if (!set) continue
  checked++
  const self = pathOf(file)
  const entries = set.split('\n').map((l) => l.split(' '))
  if (!entries.some(([, href]) => new URL(href).pathname === self)) errors.push(`${self}: nennt sich nicht selbst`)
  if (!entries.some(([lang]) => lang === 'x-default')) errors.push(`${self}: x-default fehlt`)
  for (const [lang, href] of entries) {
    if (lang === 'x-default') continue
    const target = fileOf(href)
    if (!existsSync(target)) {
      errors.push(`${self}: ${lang} → ${href} existiert nicht`)
      continue
    }
    if (alternatesOf(readFileSync(target, 'utf8')) !== set) errors.push(`${self}: ${lang} → ${href} verweist nicht identisch zurück`)
  }
}

if (errors.length) {
  console.error(`\n✖ check-hreflang: ${errors.length} Fehler:\n  ${errors.join('\n  ')}\n`)
  process.exit(1)
}
console.log(`✔ check-hreflang: ${checked} Seiten mit hreflang – alle wechselseitig.`)
