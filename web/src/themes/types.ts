/**
 * Vertrag zwischen Seiten und Themes.
 * Jedes Theme in src/themes/<name>/ muss diese Komponenten mit diesen Props bereitstellen:
 *   tokens.css, theme.ts, Header.astro, Footer.astro, Card.astro, Listing.astro, ArticleLayout.astro
 */
import type { CardItem, LocaleId, SanityImage } from '../lib/types'

export interface NavLink {
  label: string
  href: string
  current?: boolean
}

export interface LanguageLink {
  lang: LocaleId
  label: string
  href: string
  current: boolean
  /** true, wenn es eine echte Übersetzung dieser Seite ist (sonst Startseite der Sprache) */
  isTranslation: boolean
}

export interface HeaderProps {
  lang: LocaleId
  siteName: string
  homeHref: string
  logo?: SanityImage
  tagline?: string
  nav: NavLink[]
  languages: LanguageLink[]
}

export interface FooterProps {
  lang: LocaleId
  siteName: string
  homeHref: string
  text?: string
  nav: NavLink[]
  categories: NavLink[]
  legal: NavLink[]
  social: NavLink[]
  rssHref: string
}

export interface CardProps {
  item: CardItem
  variant?: 'lead' | 'default' | 'compact'
  headingLevel?: 2 | 3
  priority?: boolean
}

export interface ListingProps {
  items: CardItem[]
  lang: LocaleId
  /** home = Startseite Seite 1 (mit Aufmacher), archive = gleichförmige Liste */
  variant: 'home' | 'archive'
}

export interface ArticleLayoutProps {
  lang: LocaleId
  title: string
  kicker?: NavLink
  image?: SanityImage
  /** true = Seitenleiste (Inhaltsverzeichnis) anzeigen, sofern das Theme eine hat */
  hasAside?: boolean
}

export interface ThemeDefinition {
  /** Schriftdateien, die per <link rel="preload"> vorgeladen werden */
  fontPreloads: string[]
  /** Favicon (SVG), falls in Sanity keines gepflegt ist */
  favicon: string
  /** Farbe für <meta name="theme-color"> */
  themeColor: string
}
