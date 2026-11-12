import type { APIRoute } from 'astro'
import { robots } from '../lib/feeds'

export const GET: APIRoute = () => robots()
