import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers"

export interface WeChatProfile {
  openid: string
  nickname: string
  sex: number
  province: string
  city: string
  country: string
  headimgurl: string
  privilege: string[]
  unionid?: string
}

export type WeChatPlatformType = "OfficialAccount" | "WebsiteApp"

export interface WeChatConfig extends OAuthUserConfig<WeChatProfile> {
  platformType?: WeChatPlatformType
}

/**
 * 微信 OAuth Provider
 * 支持微信公众号和微信网页应用登录
 * 
 * @see https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
 */
export default function WeChat(config: WeChatConfig): OAuthConfig<WeChatProfile> {
  const platformType = config.platformType ?? "WebsiteApp"
  
  // 微信网页应用使用 open.weixin.qq.com
  // 微信公众号使用 open.weixin.qq.com 但授权页面不同
  const authorizationUrl = platformType === "WebsiteApp"
    ? "https://open.weixin.qq.com/connect/qrconnect"
    : "https://open.weixin.qq.com/connect/oauth2/authorize"

  return {
    id: "wechat",
    name: "WeChat",
    type: "oauth",
    
    authorization: {
      url: authorizationUrl,
      params: {
        appid: config.clientId,
        response_type: "code",
        scope: platformType === "WebsiteApp" ? "snsapi_login" : "snsapi_userinfo",
        state: "STATE",
      },
    },
    
    token: {
      url: "https://api.weixin.qq.com/sns/oauth2/access_token",
      async request({ params, provider }: { params: { code?: string }; provider: { clientId?: string; clientSecret?: string } }) {
        const response = await fetch(
          `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${provider.clientId}&secret=${provider.clientSecret}&code=${params.code}&grant_type=authorization_code`
        )
        const tokens = await response.json()
        return { tokens }
      },
    },
    
    userinfo: {
      url: "https://api.weixin.qq.com/sns/userinfo",
      async request({ tokens }: { tokens: { access_token?: string; openid?: string } }) {
        const response = await fetch(
          `https://api.weixin.qq.com/sns/userinfo?access_token=${tokens.access_token}&openid=${tokens.openid}&lang=zh_CN`
        )
        return await response.json()
      },
    },
    
    profile(profile) {
      return {
        id: profile.unionid ?? profile.openid,
        name: profile.nickname,
        email: null, // 微信不提供邮箱
        image: profile.headimgurl,
      }
    },
    
    style: {
      bg: "#07C160",
      text: "#fff",
    },
    
    options: config,
  }
}
