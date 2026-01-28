import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
    // 设置一个非常长的过期时间（约100年），实现"永不过期"
    maxAge: 100 * 365 * 24 * 60 * 60,
  },
  callbacks: {
    async session({ session, user }) {
      // 将用户ID添加到session
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      // 只有特定邮箱的用户自动关联到默认宝宝（卜卜）
      const allowedEmails = ["stupidism32@gmail.com", "sunfeng32@qq.com"]
      
      if (user.id && user.email && allowedEmails.includes(user.email)) {
        const defaultBaby = await prisma.baby.findFirst({
          where: { name: "卜卜" }
        })
        
        if (defaultBaby) {
          await prisma.babyUser.create({
            data: {
              userId: user.id,
              babyId: defaultBaby.id,
              isDefault: true,
            }
          }).catch(() => {
            // 如果已存在关联则忽略
          })
        }
      }
      // 其他用户需要自己创建宝宝
    },
  },
  pages: {
    signIn: "/login",
  },
})
