import { defineConfig, type DocumentActionComponent } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import {
  documentInternationalization,
  useDeleteTranslationAction,
  useDuplicateWithTranslationsAction,
} from '@sanity/document-internationalization'
import { siteConfig, type LocaleId } from '../site.config'
import { docPath, absoluteUrl, type RoutableType } from '../shared/routing'
import { schemaTypes, singletonTypes, translatedTypes } from './schemas'
import { structure } from './structure'

const { projectId, dataset, apiVersion } = siteConfig.sanity

/** Erlaubte Aktionen für Singletons (kein Löschen, kein Duplizieren) */
const singletonActions = new Set(['publish', 'discardChanges', 'restore'])

export default defineConfig({
  name: 'default',
  title: siteConfig.name,
  projectId,
  dataset,

  plugins: [
    structureTool({ structure }),
    documentInternationalization({
      supportedLanguages: siteConfig.locales.map(({ id, title }) => ({ id, title })),
      schemaTypes: translatedTypes,
      languageField: 'language',
      apiVersion,
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],

  schema: {
    types: schemaTypes,
    // Standard-Vorlagen ohne Sprache ausblenden: übersetzte Typen nur mit Sprache anlegen, Singletons gar nicht
    templates: (prev) =>
      prev.filter(
        (t) =>
          !singletonTypes.has(t.schemaType) &&
          !translatedTypes.includes(t.id) &&
          !t.id.endsWith('-parameterized'),
      ),
  },

  document: {
    actions: (prev, { schemaType }) => {
      if (singletonTypes.has(schemaType)) {
        return prev.filter(({ action }) => action && singletonActions.has(action))
      }
      if (translatedTypes.includes(schemaType)) {
        return [
          ...prev.filter(({ action }) => action !== 'duplicate'),
          useDuplicateWithTranslationsAction as DocumentActionComponent,
          useDeleteTranslationAction as DocumentActionComponent,
        ]
      }
      return prev
    },
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global'
        ? prev.filter((item) => !singletonTypes.has(item.templateId) && !item.templateId.endsWith('-parameterized'))
        : prev,
    // „Live ansehen“-Link im Dokumentmenü
    productionUrl: async (prev, { document }) => {
      const doc = document as { _type: string; language?: LocaleId; slug?: { current?: string } }
      const routable: RoutableType[] = ['article', 'comparison', 'review', 'glossaryTerm', 'landingPage', 'page']
      if (!routable.includes(doc._type as RoutableType) || !doc.language || !doc.slug?.current) return prev
      return absoluteUrl(docPath(doc._type as RoutableType, doc.language, doc.slug.current))
    },
  },
})
