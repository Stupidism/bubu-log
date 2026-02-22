import { NextResponse } from 'next/server'
import {
  APP_BACKGROUND_COLOR,
  APP_DESCRIPTION,
  APP_NAME,
  appIcon192,
  appIcon512,
  appIconSvg,
  themeColor,
} from '@/lib/branding'

export function GET() {
  return NextResponse.json({
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: APP_BACKGROUND_COLOR,
    theme_color: themeColor,
    orientation: 'portrait',
    icons: [
      {
        src: appIcon192,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: appIcon512,
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: appIconSvg,
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  })
}
