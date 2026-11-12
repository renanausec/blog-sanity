import type { APIRoute } from 'astro'
import { sitemapIndex } from '../lib/feeds'

export const GET: APIRoute = () => sitemapIndex()
