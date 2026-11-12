import type { ThemeDefinition } from '../types'
import headingFont from './fonts/fraunces-latin-wght-normal.woff2?url'
import bodyFont from './fonts/source-sans-3-latin-wght-normal.woff2?url'
import favicon from './favicon.svg?url'

export const theme: ThemeDefinition = {
  fontPreloads: [headingFont, bodyFont],
  favicon,
  themeColor: '#fbf7f1',
}
