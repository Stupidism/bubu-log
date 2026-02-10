'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  threshold?: number // 触发刷新的下拉距离阈值
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  threshold = 80 
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // 只在页面顶部时启用下拉刷新
    if (window.scrollY > 0 || isRefreshing) return
    
    startY.current = e.touches[0].clientY
    setIsPulling(true)
  }, [isRefreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return
    
    currentY.current = e.touches[0].clientY
    const distance = currentY.current - startY.current
    
    // 只处理向下拉
    if (distance > 0 && window.scrollY <= 0) {
      // 添加阻尼效果，拉得越远阻力越大
      const dampedDistance = Math.min(distance * 0.5, threshold * 1.5)
      setPullDistance(dampedDistance)
      
      // 防止页面滚动
      if (dampedDistance > 10) {
        e.preventDefault()
      }
    }
  }, [isPulling, isRefreshing, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return
    
    setIsPulling(false)
    
    if (pullDistance >= threshold && !isRefreshing) {
      // 触发刷新
      setIsRefreshing(true)
      setPullDistance(threshold * 0.6) // 保持一个小的下拉距离显示加载动画
      
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // 未达到阈值，回弹
      setPullDistance(0)
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 使用 passive: false 以便可以 preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  // 计算进度百分比
  const progress = Math.min(pullDistance / threshold, 1)
  const rotation = progress * 180

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* 下拉刷新指示器 */}
      <div 
        className="absolute left-0 right-0 flex justify-center items-center transition-all duration-200 overflow-hidden z-10"
        style={{ 
          height: pullDistance,
          top: 0,
        }}
      >
        <div 
          className={`flex flex-col items-center justify-center transition-all ${
            isRefreshing ? 'animate-pulse' : ''
          }`}
        >
          <RefreshCw 
            size={28} 
            className={`text-primary transition-transform ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{ 
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
              opacity: progress,
            }}
          />
          {pullDistance > 20 && (
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isRefreshing 
                ? '刷新中...' 
                : progress >= 1 
                  ? '释放刷新' 
                  : '下拉刷新'}
            </span>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

