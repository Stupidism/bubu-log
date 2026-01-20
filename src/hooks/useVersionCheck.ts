'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * 检测应用是否有新版本
 * 通过比较页面加载时的 HTML hash 和当前服务器上的 HTML hash 来判断
 */
export function useVersionCheck(checkInterval = 60000) {
  const [hasNewVersion, setHasNewVersion] = useState(false)
  const [initialHash, setInitialHash] = useState<string | null>(null)

  // 获取页面的 hash（使用 Next.js 的 buildId 或页面内容的 hash）
  const getPageHash = useCallback(async (): Promise<string | null> => {
    try {
      // 请求首页，添加时间戳避免缓存
      const response = await fetch(`/?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      const html = await response.text()
      
      // 从 HTML 中提取 Next.js 的 buildId
      const buildIdMatch = html.match(/"buildId":"([^"]+)"/)
      if (buildIdMatch) {
        return buildIdMatch[1]
      }
      
      // 备选：使用脚本标签的 hash
      const scriptMatch = html.match(/_next\/static\/([^/]+)\/_buildManifest\.js/)
      if (scriptMatch) {
        return scriptMatch[1]
      }
      
      return null
    } catch (error) {
      console.error('Failed to check version:', error)
      return null
    }
  }, [])

  // 初始化：记录当前版本的 hash
  useEffect(() => {
    const init = async () => {
      // 从当前页面的 script 标签获取 buildId
      const scripts = document.querySelectorAll('script[src*="_next/static/"]')
      for (const script of scripts) {
        const src = script.getAttribute('src')
        const match = src?.match(/_next\/static\/([^/]+)\//)
        if (match) {
          setInitialHash(match[1])
          return
        }
      }
      
      // 如果从 script 标签找不到，尝试从 __NEXT_DATA__ 获取
      const nextData = document.getElementById('__NEXT_DATA__')
      if (nextData) {
        try {
          const data = JSON.parse(nextData.textContent || '{}')
          if (data.buildId) {
            setInitialHash(data.buildId)
          }
        } catch (e) {
          console.error('Failed to parse __NEXT_DATA__:', e)
        }
      }
    }
    
    init()
  }, [])

  // 定期检查新版本
  useEffect(() => {
    if (!initialHash) return

    const checkVersion = async () => {
      const currentHash = await getPageHash()
      if (currentHash && currentHash !== initialHash) {
        setHasNewVersion(true)
      }
    }

    // 页面可见时检查
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion()
      }
    }

    // 定期检查
    const interval = setInterval(checkVersion, checkInterval)
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [initialHash, checkInterval, getPageHash])

  const refresh = useCallback(() => {
    window.location.reload()
  }, [])

  const dismiss = useCallback(() => {
    setHasNewVersion(false)
  }, [])

  return { hasNewVersion, refresh, dismiss }
}


