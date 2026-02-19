'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

export const USER_ROLE_VALUES = [
  'ADMIN',
  'DAD',
  'MOM',
  'NANNY',
  'GRANDPARENT',
  'OTHER',
] as const

export type UserRole = (typeof USER_ROLE_VALUES)[number]

export type AdminBaby = {
  id: string
  name: string
  birthDate: string | null
  createdAt: string
  userCount: number
}

export type AdminManagedUser = {
  id: string
  username: string | null
  name: string | null
  email: string | null
  role: UserRole
  createdAt: string
  babyIds: string[]
  babyNames: string[]
  defaultBabyId: string | null
  defaultBabyName: string | null
}

type AdminDashboardProps = {
  adminName: string
  initialBabies: AdminBaby[]
  initialUsers: AdminManagedUser[]
}

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'ADMIN', label: '管理员' },
  { value: 'DAD', label: '爸爸' },
  { value: 'MOM', label: '妈妈' },
  { value: 'NANNY', label: '月嫂' },
  { value: 'GRANDPARENT', label: '祖辈' },
  { value: 'OTHER', label: '其他' },
]

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: '管理员',
  DAD: '爸爸',
  MOM: '妈妈',
  NANNY: '月嫂',
  GRANDPARENT: '祖辈',
  OTHER: '其他',
}

function formatDateLabel(dateValue: string | null): string {
  if (!dateValue) {
    return '-'
  }

  return new Date(dateValue).toLocaleDateString('zh-CN')
}

export function AdminDashboard({ adminName, initialBabies, initialUsers }: AdminDashboardProps) {
  const [babies, setBabies] = useState(initialBabies)
  const [users, setUsers] = useState(initialUsers)

  const [babyName, setBabyName] = useState('')
  const [babyBirthDate, setBabyBirthDate] = useState('')
  const [creatingBaby, setCreatingBaby] = useState(false)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('OTHER')
  const [defaultBabyId, setDefaultBabyId] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)

  const sortedBabiesForSelect = useMemo(
    () => [...babies].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
    [babies]
  )

  async function handleCreateBaby(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!babyName.trim()) {
      toast.error('请输入宝宝名称')
      return
    }

    setCreatingBaby(true)

    try {
      const response = await fetch('/api/admin/babies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: babyName.trim(),
          birthDate: babyBirthDate || null,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || '创建宝宝失败')
      }

      setBabies((current) => [payload as AdminBaby, ...current])
      setBabyName('')
      setBabyBirthDate('')
      toast.success('宝宝创建成功')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建宝宝失败')
    } finally {
      setCreatingBaby(false)
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!username.trim()) {
      toast.error('请输入用户名')
      return
    }

    if (password.length < 8) {
      toast.error('密码至少 8 位')
      return
    }

    setCreatingUser(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          name: name.trim() || null,
          email: email.trim() || null,
          role,
          defaultBabyId: defaultBabyId || null,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || '创建账号失败')
      }

      setUsers((current) => [payload as AdminManagedUser, ...current])
      setUsername('')
      setPassword('')
      setName('')
      setEmail('')
      setRole('OTHER')
      setDefaultBabyId('')
      toast.success('账号创建成功')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建账号失败')
    } finally {
      setCreatingUser(false)
    }
  }

  return (
    <main className="px-4 py-5 space-y-4">
      <header className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">后台管理</p>
            <h1 className="text-xl font-semibold text-gray-900">管理员：{adminName}</h1>
          </div>
          <Link
            href="/"
            className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
          >
            返回首页
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">新增宝宝</h2>
        <form className="mt-3 grid grid-cols-1 gap-3" onSubmit={handleCreateBaby}>
          <input
            type="text"
            value={babyName}
            onChange={(event) => setBabyName(event.target.value)}
            placeholder="宝宝名称"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            required
          />
          <input
            type="date"
            value={babyBirthDate}
            onChange={(event) => setBabyBirthDate(event.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={creatingBaby}
            className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingBaby ? '创建中...' : '创建宝宝'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">新增可登录账户</h2>
        <form className="mt-3 grid grid-cols-1 gap-3" onSubmit={handleCreateUser}>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="用户名（必填）"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="密码（至少 8 位）"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            required
            minLength={8}
          />
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="姓名（可选）"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="邮箱（可选）"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={defaultBabyId}
            onChange={(event) => setDefaultBabyId(event.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">默认宝宝（可选）</option>
            {sortedBabiesForSelect.map((baby) => (
              <option key={baby.id} value={baby.id}>
                {baby.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creatingUser}
            className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingUser ? '创建中...' : '创建账号'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">宝宝列表 ({babies.length})</h2>
        <div className="mt-3 divide-y divide-gray-100">
          {babies.length === 0 ? (
            <p className="py-3 text-sm text-gray-500">暂无宝宝</p>
          ) : (
            babies.map((baby) => (
              <div key={baby.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{baby.name}</p>
                  <p className="text-gray-500">生日：{formatDateLabel(baby.birthDate)}</p>
                </div>
                <p className="text-gray-500">关联用户：{baby.userCount}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">账户列表 ({users.length})</h2>
        <div className="mt-3 divide-y divide-gray-100">
          {users.length === 0 ? (
            <p className="py-3 text-sm text-gray-500">暂无账号</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="space-y-1 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-gray-900">{user.username || '未设置用户名'}</p>
                  <p className="text-gray-500">{ROLE_LABELS[user.role]}</p>
                </div>
                <p className="text-gray-500">姓名：{user.name || '-'}</p>
                <p className="text-gray-500">邮箱：{user.email || '-'}</p>
                <p className="text-gray-500">
                  默认宝宝：{user.defaultBabyName || '-'}
                </p>
                <p className="text-gray-500">
                  已关联宝宝：{user.babyNames.length > 0 ? user.babyNames.join('、') : '-'}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
