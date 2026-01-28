import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./openapi-types";

// 自定义 fetch 函数，添加 401 错误处理
const customFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  
  // 如果返回 401，重定向到登录页
  if (response.status === 401) {
    // 只在客户端执行重定向
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  
  return response;
};

const fetchClient = createFetchClient<paths>({
  baseUrl: "/api",
  fetch: customFetch,
});

export const $api = createClient(fetchClient);

