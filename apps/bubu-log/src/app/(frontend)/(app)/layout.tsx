import { ModalContainer } from '@/components/modals/ModalContainer'
import { AgentationWrapper } from '@/components/AgentationWrapper'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {/* Mobile-first: 限制最大宽度，PC端保持手机比例 */}
      <div className="phone-container mx-auto max-w-md min-h-screen bg-background shadow-xl relative">
        {children}
      </div>
      {/* 全局弹窗容器 - 仅主 App 路由使用 */}
      <ModalContainer />
      {/* 开发环境视觉反馈工具 */}
      <AgentationWrapper />
    </>
  )
}
