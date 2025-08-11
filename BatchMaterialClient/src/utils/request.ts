import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 在 .env 文件中配置
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 统一处理响应数据
    return response.data;
  },
  error => {
    // 统一错误处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          ElMessage({
            type: 'error',
            message: `请求数据错误`
          });
          break;
        case 500:
          ElMessage({
            type: 'error',
            message: `服务器发送错误`
          });
          break;
        default:
          ElMessage({
            type: 'error',
            message: `发送错误，错误码${error.response.status}`
          });
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default service;
