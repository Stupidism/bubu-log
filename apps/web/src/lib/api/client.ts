import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./openapi-types";

const fetchClient = createFetchClient<paths>({
  baseUrl: "/api",
  fetch: async (url, init) => {
    const response = await fetch(url, init);
    
    // 如果返回 401，重定向到登录页
    if (response.status === 401) {
      // 只在客户端执行重定向
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return response;
  },
});

export const $api = createClient(fetchClient);

