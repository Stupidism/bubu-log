'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { ActivityDetailModal } from './ActivityDetailModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { DiaperModal } from './DiaperModal'
import { BreastfeedModal } from './BreastfeedModal'
import { BottleModal } from './BottleModal'
import { PumpModal } from './PumpModal'
import { SleepStartModal } from './SleepStartModal'
import { SleepEndModal } from './SleepEndModal'
import { ActivityDurationModal } from './ActivityDurationModal'
import { CountActivityModal } from './CountActivityModal'
import { SupplementModal } from './SupplementModal'
import { SpitUpModal } from './SpitUpModal'

/**
 * ModalContainer 渲染所有弹窗组件
 * 
 * 每个弹窗组件自己读取 URL 参数来决定是否显示，
 * 所以可以一次性渲染所有弹窗，让它们各自管理自己的状态
 */
export function ModalContainer() {
  const pathname = usePathname()
  if (pathname?.startsWith('/login')) {
    return null
  }

  return (
    <Suspense fallback={null}>
      {/* 活动详情/编辑弹窗 */}
      <ActivityDetailModal />
      
      {/* 删除确认弹窗 */}
      <DeleteConfirmModal />
      
      {/* 换尿布弹窗 */}
      <DiaperModal />
      
      {/* 亲喂弹窗 */}
      <BreastfeedModal />
      
      {/* 瓶喂弹窗 */}
      <BottleModal />
      
      {/* 吸奶弹窗 */}
      <PumpModal />
      
      {/* 入睡弹窗 */}
      <SleepStartModal />
      
      {/* 睡醒弹窗 */}
      <SleepEndModal />
      
      {/* 其他活动弹窗（抬头、被动操、排气操、洗澡、户外、早教） */}
      <ActivityDurationModal />
      
      {/* 计数类活动弹窗（翻身、拉坐） */}
      <CountActivityModal />
      
      {/* 补剂弹窗 */}
      <SupplementModal />
      
      {/* 吐奶弹窗 */}
      <SpitUpModal />
    </Suspense>
  )
}
