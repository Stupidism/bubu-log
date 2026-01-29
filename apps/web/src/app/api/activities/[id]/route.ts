import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { requireAuth } from '@/lib/auth/get-current-baby'

// 点事件类型（没有时长的活动，endTime 应该与 startTime 相同）
const POINT_EVENT_TYPES = ['DIAPER', 'SUPPLEMENT']

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: 获取单个活动
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { baby } = await requireAuth()
    const { id } = await params
    
    const activity = await prisma.activity.findFirst({
      where: { id, babyId: baby.id },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(activity)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Failed to fetch activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}

// PATCH: 更新活动
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { baby, user } = await requireAuth()
    const { id } = await params
    const body = await request.json()
    
    // 获取原活动信息用于生成描述（确保属于当前宝宝）
    const originalActivity = await prisma.activity.findFirst({
      where: { id, babyId: baby.id },
    })

    if (!originalActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    const {
      type,
      startTime,
      endTime,
      hasPoop,
      hasPee,
      poopColor,
      poopPhotoUrl,
      peeAmount,
      burpSuccess,
      milkAmount,
      breastFirmness,
      notes,
    } = body

    const updateData: Record<string, unknown> = {}

    // 判断活动类型（使用更新后的类型，或原活动的类型）
    const activityType = type ?? originalActivity.type
    const isPointEvent = POINT_EVENT_TYPES.includes(activityType)

    if (type !== undefined) updateData.type = type
    if (startTime !== undefined) {
      const startTimeDate = new Date(startTime)
      updateData.startTime = startTimeDate
      // 点事件的 endTime 应该与 startTime 相同
      if (isPointEvent) {
        updateData.endTime = startTimeDate
      }
    }
    if (endTime !== undefined && !isPointEvent) {
      // 只有非点事件才允许独立设置 endTime
      updateData.endTime = endTime ? new Date(endTime) : null
    }
    if (hasPoop !== undefined) updateData.hasPoop = hasPoop
    if (hasPee !== undefined) updateData.hasPee = hasPee
    if (poopColor !== undefined) updateData.poopColor = poopColor
    if (poopPhotoUrl !== undefined) updateData.poopPhotoUrl = poopPhotoUrl
    if (peeAmount !== undefined) updateData.peeAmount = peeAmount
    if (burpSuccess !== undefined) updateData.burpSuccess = burpSuccess
    if (milkAmount !== undefined) updateData.milkAmount = milkAmount
    if (breastFirmness !== undefined) updateData.breastFirmness = breastFirmness
    if (notes !== undefined) updateData.notes = notes

    const activity = await prisma.activity.update({
      where: { id },
      data: updateData,
    })

    // 生成修改描述
    const typeLabel = ActivityTypeLabels[activity.type as ActivityType] || activity.type
    const description = `修改${typeLabel}`

    // 记录审计日志
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        resourceType: 'ACTIVITY',
        resourceId: activity.id,
        inputMethod: 'TEXT',
        inputText: null,
        description,
        success: true,
        beforeData: originalActivity as object,
        afterData: activity as object,
        activityId: activity.id,
        babyId: baby.id,
        userId: user.id,
      },
    })

    return NextResponse.json(activity)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Failed to update activity:', error)
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    )
  }
}

// DELETE: 删除活动
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { baby, user } = await requireAuth()
    const { id } = await params
    
    // 获取活动信息用于生成描述（确保属于当前宝宝）
    const activity = await prisma.activity.findFirst({
      where: { id, babyId: baby.id },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    const typeLabel = ActivityTypeLabels[activity.type as ActivityType] || activity.type

    await prisma.activity.delete({
      where: { id },
    })

    // 记录审计日志
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        resourceType: 'ACTIVITY',
        resourceId: id,
        inputMethod: 'TEXT',
        inputText: null,
        description: `删除${typeLabel}`,
        success: true,
        beforeData: activity as Prisma.InputJsonValue,
        afterData: Prisma.JsonNull,
        activityId: null,
        babyId: baby.id,
        userId: user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Failed to delete activity:', error)
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    )
  }
}
