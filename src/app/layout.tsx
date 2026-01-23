import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { ModalContainer } from '@/components/modals/ModalContainer'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: '宝宝日记 - Baby Care Tracker',
  description: '记录宝宝的睡眠、喂奶、换尿布和日常活动',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '宝宝日记',
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
          {/* Mobile-first: 限制最大宽度，PC端保持手机比例 */}
          <div className="phone-container mx-auto max-w-md min-h-screen bg-background shadow-xl relative">
            {children}
          </div>
          {/* 全局弹窗容器 - 通过 URL 参数控制 */}
          <ModalContainer />
          {/* 全局 Toast 提示 */}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
