/**
 * Automatische interne Verlinkung auf das Glossar.
 *
 * Verlinkt im Fließtext das jeweils erste Vorkommen eines Glossarbegriffs (Titel oder Synonym)
 * derselben Sprache. Nicht in Überschriften, nicht innerhalb bestehender Links oder Code,
 * höchstens einmal pro Begriff und Seite, maximal `max` automatische Links.
 *
 * Ergebnis: neuer Portable-Text-Wert + Liste der erwähnten Begriffe (für schema.org mentions
 * und „Erwähnt in“ auf der Glossarseite).
 */
import type { GlossaryTerm, LocaleId, PortableTextValue } from './types'

interface Span {
  _type: 'span'
  _key: string
  text: string
  marks?: string[]
}
interface Block {
  _type: 'block'
  _key: string
  style?: string
  markDefs?: { _key: string; _type: string; target?: { slug?: string; language?: string } }[]
  children?: Span[]
  [k: string]: unknown
}

interface Pattern {
  key: string
  term: GlossaryTerm
  regex: RegExp
  length: number
}

const LINK_MARKS = new Set(['link', 'internalLink', 'glossaryLink'])
const SKIP_STYLES = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

export const termKey = (lang: string, slug: string) => `${lang}:${slug}`

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Muster je Sprache, längste zuerst (damit „ERP-System“ vor „ERP“ greift) */
export function buildPatterns(terms: GlossaryTerm[], lang: LocaleId): Pattern[] {
  return terms
    .filter((t) => t.language === lang && !t.seo?.noIndex)
    .flatMap((term) =>
      [term.title, ...(term.alternateNames ?? [])]
        .map((p) => p?.trim())
        .filter((p): p is string => !!p && p.length >= 2)
        .map((p) => {
          // Abkürzungen (nur Großbuchstaben/Ziffern) exakt, sonst ohne Groß-/Kleinschreibung
          const exact = p === p.toUpperCase()
          return {
            key: termKey(lang, term.slug),
            term,
            regex: new RegExp(`(?<![\\p{L}\\p{N}])${escape(p)}(?![\\p{L}\\p{N}])`, exact ? 'u' : 'iu'),
            length: p.length,
          }
        }),
    )
    .sort((a, b) => b.length - a.length)
}

/** Bereits manuell verlinkte Begriffe sammeln */
function collectExisting(value: PortableTextValue, linked: Set<string>) {
  for (const block of value as unknown as Block[]) {
    for (const def of block.markDefs ?? []) {
      if (def._type === 'glossaryLink' && def.target?.slug && def.target.language) {
        linked.add(termKey(def.target.language, def.target.slug))
      }
    }
  }
}

export function autoLinkGlossary(
  value: PortableTextValue | undefined,
  patterns: Pattern[],
  linked: Set<string>,
  opts: { exclude?: string; max?: number } = {},
): PortableTextValue | undefined {
  if (!value?.length || !patterns.length) return value
  collectExisting(value, linked)
  const max = opts.max ?? 12
  let added = 0
  let counter = 0

  return (value as unknown as Block[]).map((block) => {
    if (block._type !== 'block' || SKIP_STYLES.has(block.style ?? '') || !block.children) return block
    const linkKeys = new Set(
      (block.markDefs ?? []).filter((d) => LINK_MARKS.has(d._type)).map((d) => d._key),
    )
    const markDefs = [...(block.markDefs ?? [])]
    const children: Span[] = []

    for (const child of block.children) {
      if (child._type !== 'span' || (child.marks ?? []).some((m) => linkKeys.has(m) || m === 'code')) {
        children.push(child)
        continue
      }
      let rest = child.text
      let part = 0
      while (rest && added < max) {
        // frühesten Treffer eines noch nicht verlinkten Begriffs finden
        let best: { index: number; text: string; pattern: Pattern } | undefined
        for (const pattern of patterns) {
          if (linked.has(pattern.key) || pattern.key === opts.exclude) continue
          const m = pattern.regex.exec(rest)
          if (m && (!best || m.index < best.index || (m.index === best.index && m[0].length > best.text.length))) {
            best = { index: m.index, text: m[0], pattern }
          }
        }
        if (!best) break
        const markKey = `gl${(counter++).toString(36)}`
        const { term } = best.pattern
        markDefs.push({
          _key: markKey,
          _type: 'glossaryLink',
          target: { _type: 'glossaryTerm', language: term.language, slug: term.slug, title: term.title, shortDefinition: term.shortDefinition },
        } as never)
        if (best.index > 0) children.push({ ...child, _key: `${child._key}-${part++}`, text: rest.slice(0, best.index) })
        children.push({
          ...child,
          _key: `${child._key}-${part++}`,
          text: best.text,
          marks: [...(child.marks ?? []), markKey],
        })
        rest = rest.slice(best.index + best.text.length)
        linked.add(best.pattern.key)
        added++
      }
      if (rest) children.push(part ? { ...child, _key: `${child._key}-${part}`, text: rest } : child)
    }
    return { ...block, markDefs, children }
  }) as unknown as PortableTextValue
}
