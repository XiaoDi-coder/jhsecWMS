// src/utils/request.js
import axios from 'axios';

// 1. 创建 axios 实例
const request = axios.create({
  // 使用 Vite 环境变量配置基础请求路径
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  // 设置超时时间（例如 10 秒）
  timeout: 10000,
});

// 2. 配置【请求拦截器】
request.interceptors.request.use(
  (config) => {
    // 每次发送请求之前，先从 localStorage 中获取 Token
    const token = localStorage.getItem('wms_token');
    
    // 如果 Token 存在，则将其添加到请求头中
    if (token) {
      // 必须加上 'Bearer ' 前缀，这是我们在后端约定的格式
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // 处理请求错误
    console.error('请求拦截器发生错误:', error);
    return Promise.reject(error);
  }
);

// 3. 配置【响应拦截器】
request.interceptors.response.use(
  (response) => {
    // 如果 HTTP 状态码在 2xx 范围内，会触发这里。
    // 直接返回后端约定的数据体 (response.data)，剥离 axios 的外层包装
    return response.data;
  },
  (error) => {
    // 任何超出 2xx 范围的状态码都会触发这里
    const { response } = error;

    if (response) {
      // 获取后端返回的错误信息，如果没有则使用默认提示
      const errorMessage = response.data?.message || '网络请求发生错误';

      switch (response.status) {
        case 401:
          console.error('认证失败 (401):', errorMessage);
          // TODO: 可以在这里触发全局的提示组件 (Toast/Message)
          break;
        case 403:
          console.error('Token 失效或权限不足 (403):', errorMessage);
          // 清除本地失效的 Token 和用户信息
          localStorage.removeItem('wms_token');
          localStorage.removeItem('wms_user');
          // 强制刷新页面或触发重新登录逻辑
          // 注意：在非 React 组件文件中直接进行路由跳转可能需要特殊处理，
          // 最简单的粗暴方式是直接使用 window.location
          window.location.href = '/'; 
          break;
        case 404:
          console.error('资源不存在 (404):', errorMessage);
          break;
        case 500:
          console.error('服务器内部错误 (500):', errorMessage);
          break;
        default:
          console.error(`未知错误 (${response.status}):`, errorMessage);
      }
    } else {
      // 服务器完全没有响应（例如断网、CORS 失败或服务器宕机）
      console.error('无法连接到服务器，请检查网络设置或后端服务是否启动。');
    }

    // 将错误继续向下抛出，以便在具体的页面组件中可以 catch 到
    return Promise.reject(error);
  }
);

export default request;