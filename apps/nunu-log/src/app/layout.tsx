import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from '@bubu-log/ui/sonner'

export const metadata: Metadata = {
  title: '暖暖日记 · nunu-log',
  description: '记录睡眠、吃饭、工作、育儿与娱乐，回顾每一天的时间流向。',
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
    title: '暖暖日记',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fff7f2' },
    { media: '(prefers-color-scheme: dark)', color: '#241f1d' },
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
        <div className="phone-container mx-auto max-w-md min-h-screen bg-background shadow-xl relative">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  )
}
