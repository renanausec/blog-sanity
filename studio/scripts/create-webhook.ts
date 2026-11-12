/**
 * Legt den Sanity-Webhook an, der bei jeder Veröffentlichung einen Cloudflare-Build auslöst.
 * Idempotent: Existiert bereits ein Webhook mit demselben Namen, wird er ersetzt.
 *
 * Voraussetzung: CF_DEPLOY_HOOK in der .env im Projektstamm.
 * Ausführen:     npm run webhook -w studio
 */
import { getCliClient } from 'sanity/cli'
import { existsSync } from 'node:fs'
import { siteConfig } from '../../site.config'

const envFile = new URL('../../.env', import.meta.url).pathname
if (existsSync(envFile)) process.loadEnvFile(envFile)

const hookUrl = process.env.CF_DEPLOY_HOOK
if (!hookUrl?.startsWith('https://')) {
  console.error('CF_DEPLOY_HOOK fehlt oder ist ungültig (.env).')
  process.exit(1)
}

const { projectId, dataset } = siteConfig.sanity
const token = getCliClient().config().token
const api = `https://api.sanity.io/v2021-10-04/hooks/projects/${projectId}`
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
const NAME = 'Cloudflare Rebuild'

/** Alle Typen, deren Veröffentlichung die Website verändert */
const types = [
  'article',
  'comparison',
  'review',
  'glossaryTerm',
  'landingPage',
  'page',
  'author',
  'category',
  'siteSettings',
  'translation.metadata',
]

const existing = (await (await fetch(api, { headers })).json()) as { id: string; name: string }[]
for (const hook of existing.filter((h) => h.name === NAME)) {
  await fetch(`${api}/${hook.id}`, { method: 'DELETE', headers })
  console.log(`Alten Webhook entfernt (${hook.id}).`)
}

const res = await fetch(api, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    type: 'document',
    name: NAME,
    description: 'Veröffentlichen/Löschen → Cloudflare Pages baut die Website neu.',
    url: hookUrl,
    dataset,
    httpMethod: 'POST',
    apiVersion: 'v2025-02-19',
    includeDrafts: false,
    includeAllVersions: false,
    headers: {},
    isDisabledByUser: false,
    rule: {
      on: ['create', 'update', 'delete'],
      filter: `_type in ${JSON.stringify(types)}`,
      projection: '{_id, _type}',
    },
  }),
})

const body = (await res.json()) as { id?: string; message?: string }
if (!res.ok) {
  console.error(`Fehler ${res.status}:`, body)
  process.exit(1)
}
console.log(`Webhook „${NAME}“ angelegt (${body.id}).`)
