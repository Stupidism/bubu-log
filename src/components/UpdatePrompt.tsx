'use client'

import { RefreshCw, X } from 'lucide-react'

interface UpdatePromptProps {
  onRefresh: () => void
  onDismiss: () => void
}

export function UpdatePrompt({ onRefresh, onDismiss }: UpdatePromptProps) {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-xl p-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-white font-semibold">发现新版本</p>
          <p className="text-white/80 text-sm">点击刷新获取最新功能</p>
        </div>
        <button
          onClick={onRefresh}
          className="bg-white text-blue-600 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          <RefreshCw size={18} />
          刷新
        </button>
        <button
          onClick={onDismiss}
          className="text-white/80 hover:text-white p-1"
          aria-label="关闭"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}



