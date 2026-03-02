import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

// 创建 axios 实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Axios 拦截器：自动添加 JWT token
api.interceptors.request.use(
  async (config) => {
    // 注意：这里不能直接使用 useAuth0 hook
    // 需要在组件中调用，或者从 localStorage 获取 token
    // 这里先预留，后续可以在组件中调用 setAuthToken
    const token = localStorage.getItem('auth0_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 导出 axios 实例
export default api;

// Helper 函数用于在组件中设置 token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth0_token', token);
  } else {
    localStorage.removeItem('auth0_token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('auth0_token');
};
