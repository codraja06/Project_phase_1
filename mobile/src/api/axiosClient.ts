import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../constants/config';
import { storageService } from '../services/storage';

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (cb: () => void) => {
  onUnauthorizedCallback = cb;
};

/**
 * Returns the currently active Base URL (custom saved override if present, else default).
 */
export const getActiveBaseUrl = async (): Promise<string> => {
  const custom = await storageService.getCustomServerUrl();
  return custom || API_BASE_URL;
};

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach authorization token and apply dynamic server override
axiosClient.interceptors.request.use(
  async (config) => {
    // 1. Resolve custom server URL if configured on device
    try {
      const customUrl = await storageService.getCustomServerUrl();
      if (customUrl) {
        config.baseURL = customUrl;
      }
    } catch {
      // Ignore storage read error, fallback to initial baseURL
    }

    // 2. Attach JWT token
    const token = await storageService.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 3. Safe diagnostic log in development (no sensitive headers or request body logged)
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url || ''}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: structured error handling and friendly diagnostic messages
axiosClient.interceptors.response.use(
  (response) => {
    // Express API wraps responses in { success, data, message }
    return response.data;
  },
  async (error: AxiosError<any>) => {
    const attemptedUrl = `${error.config?.baseURL || API_BASE_URL}${error.config?.url || ''}`;
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');

    let userFriendlyMessage = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;

      // Only invoke unauthorized callback on session expiration for protected endpoints,
      // never on intentional login credential verification failures.
      if (status === 401 && !isLoginEndpoint) {
        await storageService.clearSession();
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
      }

      // Extract meaningful server error message
      if (responseData?.message) {
        userFriendlyMessage = responseData.message;
      } else if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
        userFriendlyMessage = responseData.errors
          .map((e: any) => (typeof e === 'string' ? e : e.message || 'Validation error'))
          .join('. ');
      } else if (responseData?.detail) {
        userFriendlyMessage = responseData.detail;
      } else if (status === 400) {
        userFriendlyMessage = 'Invalid request. Please check the entered data.';
      } else if (status === 401) {
        userFriendlyMessage = 'Invalid email or password.';
      } else if (status === 403) {
        userFriendlyMessage = 'Access denied. You do not have permission to perform this action.';
      } else if (status === 404) {
        userFriendlyMessage = 'Requested service endpoint was not found (404).';
      } else if (status >= 500) {
        userFriendlyMessage = 'Backend server encountered an error. Please try again later.';
      } else {
        userFriendlyMessage = `Server responded with status ${status}.`;
      }

      if (__DEV__) {
        console.warn(`[API Response Error] ${status} ${attemptedUrl}:`, userFriendlyMessage);
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      userFriendlyMessage = `Connection timed out (15s). The server at ${error.config?.baseURL || API_BASE_URL} is taking too long to respond.`;
      if (__DEV__) {
        console.warn(`[API Timeout] Target: ${attemptedUrl}`);
      }
    } else if (error.request) {
      // Native Android / iOS network error where no HTTP response was received
      const targetBase = error.config?.baseURL || API_BASE_URL;
      userFriendlyMessage = `Cannot reach backend server at ${targetBase}. Please ensure your backend is running on port 5000 and your phone is connected to the same Wi-Fi network.`;
      if (__DEV__) {
        console.warn(`[API Network Failure] Could not connect to: ${attemptedUrl} (${error.code || error.message})`);
      }
    } else if (error.message) {
      userFriendlyMessage = error.message;
    }

    return Promise.reject(new Error(userFriendlyMessage));
  }
);
