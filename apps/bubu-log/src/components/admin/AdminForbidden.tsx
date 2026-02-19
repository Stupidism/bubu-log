'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

export function AdminForbidden() {
  return (
    <main className="min-h-screen px-4 py-8 flex items-center">
      <section className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">无权限访问后台管理</h1>
        <p className="text-sm text-gray-600">
          当前账号没有管理员权限。你可以先登出，再使用管理员账号重新登录。
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            登出并重新登录
          </button>
          <Link
            href="/"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            返回首页
          </Link>
        </div>
      </section>
    </main>
  )
}
