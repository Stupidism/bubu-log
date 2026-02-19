import type { Metadata } from 'next'
import '@payloadcms/next/css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bubu 后台管理',
  description: 'Payload CMS for bubu-log',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
