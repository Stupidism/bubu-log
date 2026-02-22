import type { Metadata, Viewport } from 'next'
import '../globals.css'
import { Providers } from '../providers'
import { Toaster } from '@bubu-log/ui/sonner'
import {
  APP_NAME,
  APP_DESCRIPTION,
  DARK_THEME_COLOR,
  appAppleTouchIcon,
  webFavicon,
  webIconSvg,
  themeColor,
} from '@/lib/branding'

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: webFavicon, sizes: '32x32', type: 'image/png' },
      { url: webIconSvg, sizes: 'any', type: 'image/svg+xml' },
    ],
    apple: appAppleTouchIcon,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: themeColor },
    { media: '(prefers-color-scheme: dark)', color: DARK_THEME_COLOR },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        <Providers>
          {children}
          {/* 全局 Toast 提示 */}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
