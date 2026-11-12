/**
 * Nach dem Build: 404-Seiten der weiteren Sprachen nach /<lang>/404.html verschieben,
 * damit Cloudflare Pages sie für unbekannte URLs unter /<lang>/ ausliefert.
 */
import { existsSync, readFileSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist', import.meta.url))
// Sprachen aus site.config.ts lesen (erste = Hauptsprache ohne Präfix)
const config = readFileSync(fileURLToPath(new URL('../../site.config.ts', import.meta.url)), 'utf8')
const locales = [...config.matchAll(/\{\s*id:\s*'([a-z-]+)'/g)].map((m) => m[1])
for (const dir of locales.slice(1)) {
  const from = join(dist, dir, '404', 'index.html')
  if (existsSync(from)) {
    renameSync(from, join(dist, dir, '404.html'))
    rmSync(join(dist, dir, '404'), { recursive: true })
  }
}
