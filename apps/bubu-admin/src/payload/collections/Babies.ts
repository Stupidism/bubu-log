import type { CollectionConfig } from 'payload'
import { isCMSAdmin } from '../access/isCMSAdmin'

export const Babies: CollectionConfig = {
  slug: 'babies',
  dbName: 'Baby',
  admin: {
    useAsTitle: 'name',
    group: '业务数据',
    defaultColumns: ['name', 'gender', 'birthDate'],
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: isCMSAdmin,
    read: isCMSAdmin,
    update: isCMSAdmin,
    delete: isCMSAdmin,
  },
  fields: [
    {
      name: 'name',
      label: '宝宝姓名',
      type: 'text',
      required: true,
    },
    {
      name: 'avatarUrl',
      label: '头像 URL',
      type: 'text',
    },
    {
      name: 'birthDate',
      label: '出生日期',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'gender',
      label: '性别',
      type: 'select',
      required: true,
      defaultValue: 'OTHER',
      options: [
        { label: '男孩', value: 'BOY' },
        { label: '女孩', value: 'GIRL' },
        { label: '其他', value: 'OTHER' },
      ],
    },
  ],
}
