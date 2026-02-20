'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, PlusCircle } from 'lucide-react'
import { AvatarUpload } from '@/components/AvatarUpload'

const SHORTCUT_INSTALL_URL = process.env.NEXT_PUBLIC_IOS_SHORTCUT_INSTALL_URL || 'shortcuts://create-shortcut'

type WebhookTokenResponse = {
  token: string
  expiresAt: string
  webhookUrl: string
  babyId: string
  babyName: string
  userId: string
}

export default function SettingsPage() {
  const [isPreparing, setIsPreparing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const prepareShortcut = async () => {
    setIsPreparing(true)
    setCopied(false)
    setError(null)

    try {
      const response = await fetch('/api/webhooks/voice-input/token?days=180', {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('生成快捷指令配置失败')
      }

      const data = (await response.json()) as WebhookTokenResponse
      setExpiresAt(data.expiresAt)

      const shortcutTemplate = {
        name: '记录宝宝活动',
        description: 'Siri 听写后调用 bubu-log webhook 创建活动（当前用户自动绑定）',
        request: {
          url: data.webhookUrl,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${data.token}`,
            'Content-Type': 'application/json',
          },
          json: {
            text: '{{Dictated Text}}',
            localTime: '{{Current Date:yyyy-MM-dd HH:mm}}',
          },
        },
        response: {
          displayField: 'message',
        },
        meta: {
          babyId: data.babyId,
          babyName: data.babyName,
          userId: data.userId,
          expiresAt: data.expiresAt,
        },
      }

      const text = JSON.stringify(shortcutTemplate, null, 2)
      await navigator.clipboard.writeText(text)
      setCopied(true)

      window.location.href = SHORTCUT_INSTALL_URL
    } catch (err) {
      console.error(err)
      setError('无法生成配置，请稍后重试')
    } finally {
      setIsPreparing(false)
    }
  }

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
            从当前登录状态自动生成专属 token，并复制快捷指令配置，再打开 iPhone 快捷指令。
          </p>

          <button
            type="button"
            onClick={prepareShortcut}
            disabled={isPreparing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium text-sm"
          >
            {isPreparing ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
            {isPreparing ? '准备中...' : '新建快捷指令'}
          </button>

          {copied && (
            <p className="text-xs text-green-600 dark:text-green-400 inline-flex items-center gap-1">
              <CheckCircle2 size={14} />
              已复制快捷指令配置到剪贴板
            </p>
          )}

          {expiresAt && (
            <p className="text-xs text-gray-500">Token 过期时间：{new Date(expiresAt).toLocaleString()}</p>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <p className="text-xs text-gray-500">
            若要一键安装固定模板，可配置 `NEXT_PUBLIC_IOS_SHORTCUT_INSTALL_URL` 为 iCloud 快捷指令分享链接。
          </p>
        </div>
      </section>
    </main>
  )
}
