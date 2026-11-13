/**
 * Löst einen neuen Cloudflare-Build aus (z. B. wenn der Sanity-Webhook nicht gefeuert hat).
 * Optional mit Pfad: wartet, bis die Seite live erreichbar ist.
 *
 *   npm run rebuild
 *   npm run rebuild -- /zero-trust/
 */
const hook = process.env.CF_DEPLOY_HOOK
const site = (process.env.LIVE_URL || 'https://blog-sanity-6rv.pages.dev').replace(/\/$/, '')
const path = process.argv[2]

if (!hook?.startsWith('https://')) {
  console.error('✘ CF_DEPLOY_HOOK fehlt in .env')
  process.exit(1)
}

const res = await fetch(hook, { method: 'POST' })
if (!res.ok) {
  console.error(`✘ Deploy-Hook antwortet mit ${res.status}`)
  process.exit(1)
}
console.log('✔ Build angestoßen (dauert meist 1–2 Minuten)')
if (!path) process.exit(0)

const url = site + path
const before = await fetch(url).then((r) => r.headers.get('etag') ?? r.status).catch(() => null)
const started = Date.now()
while (Date.now() - started < 6 * 60_000) {
  await new Promise((r) => setTimeout(r, 15_000))
  const r = await fetch(url, { cache: 'no-store' }).catch(() => null)
  const tag = r ? (r.headers.get('etag') ?? r.status) : null
  if (r?.ok && tag !== before) {
    console.log(`✔ Live: ${url}`)
    process.exit(0)
  }
  process.stdout.write('.')
}
console.log(`\n… noch nicht geändert: ${url} – im Cloudflare-Dashboard prüfen`)
