/**
 * Prüft den fertigen Build (dist/) auf Spuren von Sanity:
 * cdn.sanity.io, api.sanity.io, Project ID und Dataset-Hostnamen.
 * Bricht mit Exit-Code 1 ab, wenn etwas gefunden wird – der Deploy schlägt dann fehl.
 *
 * Die Project ID wird aus site.config.ts gelesen (ohne TypeScript-Laufzeit, per RegEx).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const config = readFileSync(join(root, '..', 'site.config.ts'), 'utf8')
const projectId = config.match(/projectId:\s*'([^']+)'/)?.[1]

if (!projectId) {
  console.error('check-leaks: projectId in site.config.ts nicht gefunden.')
  process.exit(1)
}

const patterns = ['sanity.io', 'sanity.studio', projectId]
const textExt = new Set(['.html', '.xml', '.txt', '.js', '.css', '.json', '.webmanifest', '.svg', '.map'])

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else yield p
  }
}

const hits = []
let files = 0
for (const file of walk(dist)) {
  const ext = extname(file)
  if (!textExt.has(ext)) continue
  files++
  const content = readFileSync(file, 'utf8')
  for (const pattern of patterns) {
    if (content.includes(pattern)) hits.push(`${file.slice(dist.length)} → „${pattern}“`)
  }
}

if (hits.length) {
  console.error(`\n✖ check-leaks: ${hits.length} Fundstelle(n) in dist/:\n  ${hits.join('\n  ')}\n`)
  process.exit(1)
}
console.log(`✔ check-leaks: ${files} Dateien geprüft – keine Sanity-Spuren gefunden.`)
