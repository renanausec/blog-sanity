import type { APIRoute, GetStaticPaths } from 'astro'
import { localeIds, type LocaleId } from '../../../site.config'
import { sitemap } from '../lib/feeds'

export const getStaticPaths = (() => localeIds.map((lang) => ({ params: { lang } }))) satisfies GetStaticPaths

export const GET: APIRoute = ({ params }) => sitemap(params.lang as LocaleId)
