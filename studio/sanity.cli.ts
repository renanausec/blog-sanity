import { defineCliConfig } from 'sanity/cli'
import { siteConfig } from '../site.config'

export default defineCliConfig({
  api: {
    projectId: siteConfig.sanity.projectId,
    dataset: siteConfig.sanity.dataset,
  },
  studioHost: siteConfig.sanity.studioHost,
  deployment: {
    // ID der gehosteten Studio-App (nach dem ersten `sanity deploy` aus der Ausgabe übernehmen)
    appId: siteConfig.sanity.studioAppId || undefined,
    autoUpdates: true,
  },
})
