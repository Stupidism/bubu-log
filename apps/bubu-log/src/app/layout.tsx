import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@bubu-log/ui/sonner'

export const metadata: Metadata = {
  title: '卜卜日志 - Baby Care Tracker',
  description: '记录宝宝的睡眠、喂奶、换尿布和日常活动',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '卜卜日志',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fefbf6' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
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
