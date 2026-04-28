import axios from 'axios';
import i18n from './i18n';
import { getToken } from './utils/storage';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5223/api';
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Accept-Language'] = i18n.language;
  return config;
});

export default api;
