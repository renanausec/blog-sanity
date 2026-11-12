import type { APIRoute } from 'astro'
import { defaultLocale } from '../../../site.config'
import { rss } from '../lib/feeds'

export const GET: APIRoute = () => rss(defaultLocale)
