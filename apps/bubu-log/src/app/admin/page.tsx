import { redirect } from 'next/navigation'
import { getCurrentAdminUser } from '@/lib/auth/require-admin'
import { prisma } from '@/lib/prisma'
import { AdminDashboard, type AdminBaby, type AdminManagedUser } from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const adminUser = await getCurrentAdminUser()

  if (!adminUser) {
    redirect('/')
  }

  const [babies, users] = await Promise.all([
    prisma.baby.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        babies: {
          include: {
            baby: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
  ])

  const initialBabies: AdminBaby[] = babies.map((baby) => ({
    id: baby.id,
    name: baby.name,
    birthDate: baby.birthDate ? baby.birthDate.toISOString() : null,
    createdAt: baby.createdAt.toISOString(),
    userCount: baby._count.users,
  }))

  const initialUsers: AdminManagedUser[] = users.map((user) => {
    const defaultBaby = user.babies.find((item) => item.isDefault)

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      babyIds: user.babies.map((item) => item.baby.id),
      babyNames: user.babies.map((item) => item.baby.name),
      defaultBabyId: defaultBaby?.baby.id ?? null,
      defaultBabyName: defaultBaby?.baby.name ?? null,
    }
  })

  return (
    <AdminDashboard
      adminName={adminUser.name || adminUser.username || adminUser.email || '管理员'}
      initialBabies={initialBabies}
      initialUsers={initialUsers}
    />
  )
}
