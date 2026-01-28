import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🔐 设置账号密码登录...")

  // 密码: bubu20251030
  const hashedPassword = await bcrypt.hash("bubu20251030", 12)

  // 查找默认宝宝
  const defaultBaby = await prisma.baby.findFirst({
    where: { name: "卜卜" },
  })

  if (!defaultBaby) {
    console.log("❌ 未找到默认宝宝（卜卜），请先运行数据迁移")
    return
  }

  // 查找现有用户（通过邮箱或用户名）
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "sunfeng32@qq.com" },
        { username: "sunfeng32" },
      ],
    },
  })

  if (user) {
    // 更新现有用户
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: "sunfeng32",
        password: hashedPassword,
      },
    })
    console.log(`✅ 用户更新成功: ${user.username}`)
  } else {
    // 创建新用户
    user = await prisma.user.create({
      data: {
        username: "sunfeng32",
        name: "dudu",
        email: "sunfeng32@qq.com",
        password: hashedPassword,
        role: "DAD",
      },
    })
    console.log(`✅ 用户创建成功: ${user.username}`)
  }

  // 确保用户关联到默认宝宝
  await prisma.babyUser
    .upsert({
      where: {
        babyId_userId: {
          babyId: defaultBaby.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        babyId: defaultBaby.id,
        userId: user.id,
        isDefault: true,
      },
    })
    .catch(() => {
      // 忽略已存在的情况
    })

  console.log(`✅ 用户已关联到宝宝: ${defaultBaby.name}`)
  console.log("\n🎉 设置完成！")
  console.log("📝 登录信息:")
  console.log("   用户名: sunfeng32")
  console.log("   密码: bubu20251030")
}

main()
  .catch((e) => {
    console.error("❌ 错误:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
