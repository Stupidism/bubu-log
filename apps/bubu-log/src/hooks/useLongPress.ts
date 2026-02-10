'use client'

import { useCallback, useRef } from 'react'

interface UseLongPressOptions {
  /** 长按触发时间，默认 500ms */
  delay?: number
  /** 移动超过这个距离（像素）则取消长按，默认 10px */
  moveThreshold?: number
  /** 长按触发回调 */
  onLongPress: () => void
  /** 短按（普通点击）回调 */
  onClick?: () => void
}

export function useLongPress({
  delay = 500,
  moveThreshold = 10,
  onLongPress,
  onClick,
}: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressTriggered = useRef(false)
  const startPos = useRef<{ x: number; y: number } | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isLongPressTriggered.current = false
    
    // 记录起始位置
    if ('touches' in e) {
      startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else {
      startPos.current = { x: e.clientX, y: e.clientY }
    }

    timerRef.current = setTimeout(() => {
      isLongPressTriggered.current = true
      onLongPress()
    }, delay)
  }, [delay, onLongPress])

  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!startPos.current) return

    // 获取当前位置
    let currentX: number, currentY: number
    if ('touches' in e) {
      currentX = e.touches[0].clientX
      currentY = e.touches[0].clientY
    } else {
      currentX = e.clientX
      currentY = e.clientY
    }

    // 计算移动距离
    const deltaX = Math.abs(currentX - startPos.current.x)
    const deltaY = Math.abs(currentY - startPos.current.y)

    // 如果移动超过阈值，取消长按
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      clearTimer()
    }
  }, [moveThreshold, clearTimer])

  const handleEnd = useCallback(() => {
    clearTimer()
    
    // 如果没有触发长按，且有 onClick 回调，则触发短按
    if (!isLongPressTriggered.current && onClick) {
      onClick()
    }
    
    startPos.current = null
  }, [clearTimer, onClick])

  return {
    onTouchStart: handleStart,
    onTouchMove: handleMove,
    onTouchEnd: handleEnd,
    onTouchCancel: handleEnd,
    onMouseDown: handleStart,
    onMouseMove: handleMove,
    onMouseUp: handleEnd,
    onMouseLeave: handleEnd,
  }
}

