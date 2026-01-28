import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公开路由，不需要认证
  const publicRoutes = ["/login", "/api/auth", "/manifest.json"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // 检查 session cookie 是否存在
  // NextAuth.js JWT 策略使用不同的 cookie 名称
  const sessionToken = request.cookies.get("authjs.session-token") 
    || request.cookies.get("__Secure-authjs.session-token")
    || request.cookies.get("next-auth.session-token")
    || request.cookies.get("__Secure-next-auth.session-token")

  // 如果没有 session cookie，重定向到登录页
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
