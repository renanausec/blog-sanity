/**
 * Aufbau der linken Navigation im Studio:
 * Inhalte (nach Typ und Sprache) · Glossar · Autoren · Einstellungen
 */
import type { ComponentType } from 'react'
import type { StructureBuilder, StructureResolver } from 'sanity/structure'
import { BookIcon } from '@sanity/icons/Book'
import { CogIcon } from '@sanity/icons/Cog'
import { DocumentIcon } from '@sanity/icons/Document'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { FolderIcon } from '@sanity/icons/Folder'
import { RocketIcon } from '@sanity/icons/Rocket'
import { SplitHorizontalIcon } from '@sanity/icons/SplitHorizontal'
import { StarIcon } from '@sanity/icons/Star'
import { TagIcon } from '@sanity/icons/Tag'
import { UserIcon } from '@sanity/icons/User'
import { siteConfig } from '../site.config'

const apiVersion = siteConfig.sanity.apiVersion

/** Liste eines übersetzten Typs: „Alle“ + je Sprache, neue Dokumente direkt mit Sprache */
function translatedTypeItem(S: StructureBuilder, type: string, title: string, icon: ComponentType) {
  return S.listItem()
    .id(type)
    .title(title)
    .icon(icon)
    .child(
      S.list()
        .id(`${type}-languages`)
        .title(title)
        .items([
          ...siteConfig.locales.map((l) =>
            S.listItem()
              .id(`${type}-${l.id}`)
              .title(`${l.title} (${l.id.toUpperCase()})`)
              .icon(icon)
              .child(
                S.documentList()
                  .id(`${type}-${l.id}-list`)
                  .title(`${title} – ${l.title}`)
                  .schemaType(type)
                  .apiVersion(apiVersion)
                  .filter('_type == $type && language == $lang')
                  .params({ type, lang: l.id })
                  .initialValueTemplates([S.initialValueTemplateItem(`${type}-${l.id}`)]),
              ),
          ),
          S.divider(),
          S.listItem()
            .id(`${type}-all`)
            .title('Alle Sprachen')
            .icon(icon)
            .child(S.documentTypeList(type).title(`${title} – alle`).apiVersion(apiVersion)),
        ]),
    )
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title(siteConfig.name)
    .items([
      S.listItem()
        .id('content')
        .title('Inhalte')
        .icon(FolderIcon)
        .child(
          S.list()
            .id('content-types')
            .title('Inhalte')
            .items([
              translatedTypeItem(S, 'article', 'Artikel', DocumentTextIcon),
              translatedTypeItem(S, 'comparison', 'Vergleiche & Listen', SplitHorizontalIcon),
              translatedTypeItem(S, 'review', 'Reviews', StarIcon),
              translatedTypeItem(S, 'landingPage', 'Landingpages', RocketIcon),
              translatedTypeItem(S, 'page', 'Seiten', DocumentIcon),
              S.divider(),
              S.documentTypeListItem('category').title('Kategorien').icon(TagIcon),
            ]),
        ),
      translatedTypeItem(S, 'glossaryTerm', 'Glossar', BookIcon),
      S.documentTypeListItem('author').title('Autoren').icon(UserIcon),
      S.divider(),
      S.listItem()
        .id('siteSettings')
        .title('Einstellungen')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Website-Einstellungen')),
    ])
