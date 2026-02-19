import bcrypt from 'bcryptjs'
import type { CollectionConfig } from 'payload'
import { isCMSAdmin } from '../access/isCMSAdmin'

const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/

export const AppUsers: CollectionConfig = {
  slug: 'app-users',
  dbName: 'User',
  admin: {
    useAsTitle: 'username',
    group: '业务数据',
    defaultColumns: ['username', 'name', 'role', 'email'],
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: isCMSAdmin,
    read: isCMSAdmin,
    update: isCMSAdmin,
    delete: isCMSAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (!data) {
          return data
        }

        const nextData = { ...data } as Record<string, unknown>

        const username = typeof nextData.username === 'string' ? nextData.username.trim() : ''
        if (username) {
          nextData.username = username
        }

        const email = typeof nextData.email === 'string' ? nextData.email.trim() : ''
        if (email) {
          nextData.email = email.toLowerCase()
        }

        const rawPassword = typeof nextData.password === 'string' ? nextData.password.trim() : ''
        if (rawPassword) {
          if (rawPassword.length < 8 || rawPassword.length > 72) {
            throw new Error('密码长度应在 8 到 72 位之间')
          }
          nextData.password = await bcrypt.hash(rawPassword, 12)
        } else if (operation === 'create') {
          throw new Error('创建用户时必须设置密码')
        } else {
          delete nextData.password
        }

        return nextData
      },
    ],
  },
  fields: [
    {
      name: 'username',
      label: '用户名',
      type: 'text',
      required: true,
      unique: true,
      validate: (value: string | null | undefined) => {
        if (!value) {
          return '用户名不能为空'
        }
        if (value.length < 3 || value.length > 32) {
          return '用户名长度应在 3 到 32 位之间'
        }
        if (!USERNAME_REGEX.test(value)) {
          return '用户名仅支持字母、数字、点、下划线、横线'
        }
        return true
      },
    },
    {
      name: 'password',
      label: '密码',
      type: 'text',
      admin: {
        description: '创建用户或重置密码时填写，留空则不修改。',
      },
      access: {
        read: () => false,
      },
    },
    {
      name: 'name',
      label: '姓名',
      type: 'text',
    },
    {
      name: 'email',
      label: '邮箱',
      type: 'email',
      unique: true,
    },
    {
      name: 'image',
      label: '头像 URL',
      type: 'text',
    },
    {
      name: 'emailVerified',
      label: '邮箱验证时间',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'role',
      label: '角色',
      type: 'select',
      defaultValue: 'OTHER',
      required: true,
      options: [
        { label: '管理员', value: 'ADMIN' },
        { label: '爸爸', value: 'DAD' },
        { label: '妈妈', value: 'MOM' },
        { label: '月嫂', value: 'NANNY' },
        { label: '祖辈', value: 'GRANDPARENT' },
        { label: '其他', value: 'OTHER' },
      ],
    },
  ],
}
