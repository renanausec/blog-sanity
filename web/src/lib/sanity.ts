/**
 * Sanity-Client für den Build.
 * Der Lese-Token kommt aus der Umgebung und wird nur serverseitig (beim Build) genutzt.
 */
import { sanityClient } from 'sanity:client'

const token = import.meta.env.SANITY_API_READ_TOKEN ?? process.env.SANITY_API_READ_TOKEN

if (!token) {
  throw new Error(
    'SANITY_API_READ_TOKEN fehlt. Lokal in .env eintragen, in Cloudflare Pages unter Settings → Environment variables.',
  )
}

export const client = sanityClient.withConfig({
  token,
  useCdn: false,
  perspective: 'published',
})
