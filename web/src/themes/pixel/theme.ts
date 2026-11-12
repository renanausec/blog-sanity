import type { ThemeDefinition } from '../types'
import headingFont from './fonts/montserrat-latin-wght-normal.woff2?url'
import bodyFont from './fonts/roboto-latin-wght-normal.woff2?url'
import favicon from './favicon.svg?url'

export const theme: ThemeDefinition = {
  fontPreloads: [headingFont, bodyFont],
  favicon,
  themeColor: '#2a0a3a',
}
