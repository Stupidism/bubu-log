import type { CollectionConfig } from 'payload'
import { isCMSAdmin } from '../access/isCMSAdmin.ts'
import { ensureTextId } from '../utils/document.ts'

export const BabyUsers: CollectionConfig = {
  slug: 'baby-users',
  dbName: 'BabyUser',
  timestamps: false,
  admin: {
    group: '业务数据',
    useAsTitle: 'id',
    defaultColumns: ['babyId', 'userId', 'isDefault', 'createdAt'],
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: isCMSAdmin,
    read: isCMSAdmin,
    update: isCMSAdmin,
    delete: isCMSAdmin,
  },
  indexes: [
    {
      fields: ['babyId', 'userId'],
      unique: true,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (!data) {
          return data
        }

        const nextData = ensureTextId({ ...data } as Record<string, unknown>)
        if (operation === 'create' && !nextData.createdAt) {
          nextData.createdAt = new Date().toISOString()
        }
        return nextData
      },
    ],
  },
  fields: [
    {
      name: 'id',
      label: 'ID',
      type: 'text',
      dbName: 'id',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'babyId',
      label: '宝宝 ID',
      type: 'text',
      dbName: 'babyId',
      required: true,
    },
    {
      name: 'userId',
      label: '用户 ID',
      type: 'text',
      dbName: 'userId',
      required: true,
    },
    {
      name: 'isDefault',
      label: '默认宝宝',
      type: 'checkbox',
      dbName: 'isDefault',
      defaultValue: false,
    },
    {
      name: 'createdAt',
      label: '创建时间',
      type: 'date',
      dbName: 'createdAt',
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
