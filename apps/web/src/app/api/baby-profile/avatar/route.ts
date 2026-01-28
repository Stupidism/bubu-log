import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/get-current-baby'

// POST - 上传头像
export async function POST(request: NextRequest) {
  try {
    const { baby } = await requireAuth()
    
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // 获取当前头像URL（如果有的话，需要删除旧的）
    const currentBaby = await prisma.baby.findUnique({
      where: { id: baby.id },
    })

    // 删除旧头像（如果存在）
    if (currentBaby?.avatarUrl) {
      try {
        await del(currentBaby.avatarUrl)
      } catch (e) {
        // 忽略删除失败的错误，可能是旧的本地存储URL
        console.log('Could not delete old avatar:', e)
      }
    }

    // 上传新头像到 Vercel Blob
    const blob = await put(`avatars/baby-${Date.now()}.${file.type.split('/')[1]}`, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    // 更新数据库中的头像URL
    const updatedBaby = await prisma.baby.update({
      where: { id: baby.id },
      data: { avatarUrl: blob.url },
    })

    return NextResponse.json({
      url: blob.url,
      profile: updatedBaby,
    })
  } catch (error) {
    console.error('Failed to upload avatar:', error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

// DELETE - 删除头像
export async function DELETE() {
  try {
    const { baby } = await requireAuth()
    
    const currentBaby = await prisma.baby.findUnique({
      where: { id: baby.id },
    })

    if (currentBaby?.avatarUrl) {
      try {
        await del(currentBaby.avatarUrl)
      } catch (e) {
        console.log('Could not delete avatar from blob:', e)
      }

      // 清除数据库中的头像URL
      await prisma.baby.update({
        where: { id: baby.id },
        data: { avatarUrl: null },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete avatar:', error)
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    )
  }
}
