'use client'

import Link from 'next/link'
import { ArrowLeft, PlusCircle } from 'lucide-react'
import { AvatarUpload } from '@/components/AvatarUpload'

const SHORTCUT_INSTALL_URL = process.env.NEXT_PUBLIC_IOS_SHORTCUT_INSTALL_URL || 'shortcuts://create-shortcut'

export default function SettingsPage() {
  return (
    <main className="min-h-screen pb-10">
      <header className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <Link
          href="/"
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
          aria-label="返回首页"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-semibold">设置</h1>
          <p className="text-xs text-gray-500">头像与快捷指令</p>
        </div>
      </header>

      <section className="px-4 pt-6 space-y-4">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-5 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 mb-4">宝宝头像</h2>
          <div className="flex flex-col items-center gap-3">
            <AvatarUpload />
            <p className="text-xs text-gray-500">点击头像可上传或更换，右上角可删除</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-medium text-gray-500">Siri 快捷指令</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            一键打开 iPhone 快捷指令添加页，用于语音记录到 bubu-log。
          </p>

          <a
            href={SHORTCUT_INSTALL_URL}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium text-sm"
          >
            <PlusCircle size={16} />
            新建快捷指令
          </a>

          <p className="text-xs text-gray-500">
            若要一键安装固定模板，请在环境变量配置 `NEXT_PUBLIC_IOS_SHORTCUT_INSTALL_URL` 为 iCloud 快捷指令分享链接。
          </p>
        </div>
      </section>
    </main>
  )
}
