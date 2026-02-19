import type { CollectionConfig } from 'payload'
import { isCMSAdmin } from '../access/isCMSAdmin'

export const BabyUsers: CollectionConfig = {
  slug: 'baby-users',
  dbName: 'BabyUser',
  timestamps: false,
  admin: {
    group: '业务数据',
    useAsTitle: 'id',
    defaultColumns: ['baby', 'user', 'isDefault', 'createdAt'],
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
      fields: ['baby', 'user'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'baby',
      label: '宝宝',
      type: 'relationship',
      relationTo: 'babies',
      required: true,
      hasMany: false,
    },
    {
      name: 'user',
      label: '用户',
      type: 'relationship',
      relationTo: 'app-users',
      required: true,
      hasMany: false,
    },
    {
      name: 'isDefault',
      label: '默认宝宝',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'createdAt',
      label: '创建时间',
      type: 'date',
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
