'use client'

import { Agentation } from 'agentation'

export function AgentationWrapper() {
  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return <Agentation />
}
