import type { CollectionConfig } from 'payload'
import { isCMSAdmin } from '../access/isCMSAdmin.ts'
import { ensureTextId, touchTimestamps } from '../utils/document.ts'

export const Activities: CollectionConfig = {
  slug: 'activities',
  dbName: 'Activity',
  timestamps: false,
  admin: {
    group: '业务数据',
    useAsTitle: 'id',
    defaultColumns: ['type', 'startTime', 'endTime', 'babyId', 'createdAt'],
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
      fields: ['babyId'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['startTime'],
    },
    {
      fields: ['createdAt'],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (!data) {
          return data
        }

        const nextData = ensureTextId({ ...data } as Record<string, unknown>)
        touchTimestamps(nextData, operation)
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
      name: 'type',
      label: '活动类型',
      type: 'text',
      dbName: 'type',
      required: true,
      admin: {
        description:
          'SLEEP / DIAPER / BREASTFEED / BOTTLE / PUMP / HEAD_LIFT / PASSIVE_EXERCISE / ROLL_OVER / PULL_TO_SIT / GAS_EXERCISE / BATH / OUTDOOR / EARLY_EDUCATION / SUPPLEMENT / SPIT_UP',
      },
    },
    {
      name: 'startTime',
      label: '开始时间',
      type: 'date',
      dbName: 'startTime',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'endTime',
      label: '结束时间',
      type: 'date',
      dbName: 'endTime',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
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
    {
      name: 'updatedAt',
      label: '更新时间',
      type: 'date',
      dbName: 'updatedAt',
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
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
      name: 'hasPoop',
      label: '有大便',
      type: 'checkbox',
      dbName: 'hasPoop',
    },
    {
      name: 'hasPee',
      label: '有小便',
      type: 'checkbox',
      dbName: 'hasPee',
    },
    {
      name: 'poopColor',
      label: '大便颜色',
      type: 'text',
      dbName: 'poopColor',
      admin: {
        description: 'YELLOW / GREEN / BROWN / BLACK / WHITE / RED',
      },
    },
    {
      name: 'poopPhotoUrl',
      label: '大便照片 URL',
      type: 'text',
      dbName: 'poopPhotoUrl',
    },
    {
      name: 'peeAmount',
      label: '小便量',
      type: 'text',
      dbName: 'peeAmount',
      admin: {
        description: 'SMALL / MEDIUM / LARGE',
      },
    },
    {
      name: 'burpSuccess',
      label: '拍嗝成功',
      type: 'checkbox',
      dbName: 'burpSuccess',
    },
    {
      name: 'milkAmount',
      label: '奶量(ml)',
      type: 'number',
      dbName: 'milkAmount',
      min: 0,
    },
    {
      name: 'milkSource',
      label: '奶源',
      type: 'text',
      dbName: 'milkSource',
      admin: {
        description: 'BREAST_MILK / FORMULA',
      },
    },
    {
      name: 'breastFirmness',
      label: '乳房硬度',
      type: 'text',
      dbName: 'breastFirmness',
      admin: {
        description: 'SOFT / ELASTIC / HARD',
      },
    },
    {
      name: 'supplementType',
      label: '补剂类型',
      type: 'text',
      dbName: 'supplementType',
      admin: {
        description: 'AD / D3',
      },
    },
    {
      name: 'spitUpType',
      label: '吐奶类型',
      type: 'text',
      dbName: 'spitUpType',
      admin: {
        description: 'NORMAL / PROJECTILE',
      },
    },
    {
      name: 'count',
      label: '次数',
      type: 'number',
      dbName: 'count',
      min: 0,
      admin: {
        step: 1,
      },
    },
    {
      name: 'notes',
      label: '备注',
      type: 'textarea',
      dbName: 'notes',
    },
  ],
}
