import type { APIRoute } from 'astro'
import { llmsTxt } from '../lib/feeds'

export const GET: APIRoute = () => llmsTxt()
