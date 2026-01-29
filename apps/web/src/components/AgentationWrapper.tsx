'use client'

import { Agentation } from 'agentation'

export function AgentationWrapper() {
  // 只在开发环境显示
  if (process.env.NODE_ENV === 'production') {
    return null
  }
  
  return <Agentation />
}
