import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: 获取单个活动
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    const activity = await prisma.activity.findUnique({
      where: { id },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(activity)
  } catch (error) {
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
    const { id } = await params
    const body = await request.json()
    
    const {
      type,
      recordTime,
      hasPoop,
      hasPee,
      poopColor,
      poopPhotoUrl,
      peeAmount,
      burpSuccess,
      duration,
      milkAmount,
      startActivityId,
      sleepStartId,
      notes,
    } = body

    const updateData: Record<string, unknown> = {}

    if (type !== undefined) updateData.type = type
    if (recordTime !== undefined) updateData.recordTime = new Date(recordTime)
    if (hasPoop !== undefined) updateData.hasPoop = hasPoop
    if (hasPee !== undefined) updateData.hasPee = hasPee
    if (poopColor !== undefined) updateData.poopColor = poopColor
    if (poopPhotoUrl !== undefined) updateData.poopPhotoUrl = poopPhotoUrl
    if (peeAmount !== undefined) updateData.peeAmount = peeAmount
    if (burpSuccess !== undefined) updateData.burpSuccess = burpSuccess
    if (duration !== undefined) updateData.duration = duration
    if (milkAmount !== undefined) updateData.milkAmount = milkAmount
    if (startActivityId !== undefined || sleepStartId !== undefined) {
      updateData.startActivityId = sleepStartId || startActivityId
    }
    if (notes !== undefined) updateData.notes = notes

    const activity = await prisma.activity.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(activity)
  } catch (error) {
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
    const { id } = await params
    
    await prisma.activity.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete activity:', error)
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    )
  }
}
