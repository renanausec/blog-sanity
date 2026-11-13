/**
 * Bilder aus Sanity: Quell-URL (mit Zuschnitt/Hotspot) für den Build erzeugen.
 * Astro lädt die Quelle beim Build herunter, optimiert sie (AVIF/WebP) und legt sie unter /_astro/ ab.
 * Die Sanity-URL erscheint daher nie im ausgelieferten HTML.
 */
import { createImageUrlBuilder } from '@sanity/image-url'
import { getImage } from 'astro:assets'
import { siteConfig } from '../../../site.config'
import { absoluteUrl } from '../../../shared/routing'
import type { SanityImage } from './types'

const builder = createImageUrlBuilder({
  projectId: siteConfig.sanity.projectId,
  dataset: siteConfig.sanity.dataset,
})

export function hasImage(image: SanityImage | undefined | null): image is SanityImage {
  return !!(image?.asset?._id || image?.asset?._ref)
}

/** Abmessungen nach Zuschnitt */
export function croppedSize(image: SanityImage): { width: number; height: number } {
  const dim = image.asset?.metadata?.dimensions
  const width = dim?.width ?? 1600
  const height = dim?.height ?? 900
  const c = image.crop
  if (!c) return { width, height }
  return {
    width: Math.round(width * (1 - c.left - c.right)),
    height: Math.round(height * (1 - c.top - c.bottom)),
  }
}

/** Quell-URL in Zielbreite; mit `aspect` (Breite/Höhe) wird passend zum Hotspot zugeschnitten */
export function sourceUrl(image: SanityImage, width: number, aspect?: number): { url: string; width: number; height: number } {
  const size = croppedSize(image)
  const w = Math.min(width, size.width)
  const h = aspect ? Math.round(w / aspect) : Math.round((w * size.height) / size.width)
  let b = builder.image(image).width(w).quality(90)
  if (aspect) b = b.height(h).fit('crop')
  return { url: b.url(), width: w, height: h }
}

/** Ist das Bild ein PNG/SVG (Transparenz)? Dann PNG als Fallback statt JPG */
export function isTransparent(image: SanityImage): boolean {
  // Sanity kennt die echte Transparenz: ein deckendes PNG (z. B. KI-Bild) wird als JPG
  // ausgeliefert statt als mehrere hundert KB großes PNG.
  const meta = image.asset?.metadata
  if (meta?.isOpaque === true) return false
  if (meta?.hasAlpha === false) return false
  const id = image.asset?._id ?? image.asset?._ref ?? ''
  return /-(png|svg|webp|gif)$/.test(id)
}

/** Absolute URL eines optimierten Bildes (für OG, JSON-LD, RSS) */
export async function absoluteImage(
  image: SanityImage | undefined | null,
  width = 1200,
  aspect: number | undefined = 1200 / 630,
): Promise<{ url: string; width: number; height: number } | undefined> {
  if (!hasImage(image)) return undefined
  const src = sourceUrl(image, width, aspect)
  const result = await getImage({
    src: src.url,
    width: src.width,
    height: src.height,
    format: isTransparent(image) ? 'png' : 'jpg',
  })
  return { url: absoluteUrl(result.src), width: src.width, height: src.height }
}
