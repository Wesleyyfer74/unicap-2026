import axios from 'axios';
import { authStorage } from '../utils/authStorage';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 10000 });
api.interceptors.request.use((config) => { const token = authStorage.getToken(); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && authStorage.getToken()) { authStorage.clear(); window.dispatchEvent(new Event('auth:unauthorized')); }
  return Promise.reject(error);
});
export default api;
