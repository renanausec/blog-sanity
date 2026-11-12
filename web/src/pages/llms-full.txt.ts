import type { APIRoute } from 'astro'
import { llmsFullTxt } from '../lib/feeds'

export const GET: APIRoute = () => llmsFullTxt()
