import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { storageService } from '../services/storage';

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (cb: () => void) => {
  onUnauthorizedCallback = cb;
};

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

axiosClient.interceptors.request.use(
  async (config) => {
    const token = await storageService.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => {
    // Return the full response body (the Express API wraps data in { success, data })
    return response.data;
  },
  async (error) => {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      if (error.response.status === 401) {
        await storageService.clearSession();
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
      }
      message =
        error.response.data?.message ||
        error.response.data?.detail ||
        `Server error: ${error.response.status}`;
    } else if (error.request) {
      message = 'Network error. Please check your internet connection or server status.';
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);
