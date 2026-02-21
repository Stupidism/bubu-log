import type { CollectionConfig } from 'payload'
import { isCMSAdmin } from '../access/isCMSAdmin.ts'
import { ensureTextId } from '../utils/document.ts'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  dbName: 'AuditLog',
  timestamps: false,
  admin: {
    group: '业务数据',
    useAsTitle: 'id',
    defaultColumns: ['action', 'resourceType', 'description', 'success', 'createdAt'],
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: isCMSAdmin,
    read: isCMSAdmin,
    update: isCMSAdmin,
    delete: isCMSAdmin,
  },
  indexes: [
    { fields: ['babyId'] },
    { fields: ['userId'] },
    { fields: ['createdAt'] },
    { fields: ['action'] },
    { fields: ['resourceType'] },
    { fields: ['success'] },
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
    { name: 'id', label: 'ID', type: 'text', required: true, unique: true, admin: { readOnly: true } },
    { name: 'action', label: '操作类型', type: 'text', required: true, defaultValue: 'CREATE' },
    { name: 'resourceType', label: '资源类型', type: 'text', required: true, defaultValue: 'ACTIVITY' },
    { name: 'resourceId', label: '资源 ID', type: 'text' },
    { name: 'inputMethod', label: '输入方式', type: 'text', required: true },
    { name: 'inputText', label: '原始输入', type: 'textarea' },
    { name: 'description', label: '描述', type: 'text' },
    { name: 'success', label: '成功', type: 'checkbox', defaultValue: true, required: true },
    { name: 'errorMessage', label: '错误信息', type: 'textarea' },
    { name: 'beforeData', label: '修改前数据', type: 'json' },
    { name: 'afterData', label: '修改后数据', type: 'json' },
    { name: 'babyId', label: '宝宝 ID', type: 'text' },
    { name: 'activityId', label: '活动 ID', type: 'text' },
    { name: 'userId', label: '用户 ID', type: 'text' },
    {
      name: 'createdAt',
      label: '创建时间',
      type: 'date',
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
