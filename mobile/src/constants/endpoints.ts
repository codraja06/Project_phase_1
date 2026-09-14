export const ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    GOOGLE: '/auth/google',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  CITIZEN: {
    COMPLAINTS: '/complaints',
    MY_COMPLAINTS: '/complaints/my',
    COMPLAINT_DETAIL: (id: string) => `/complaints/${id}`,
  },
  AUTHORITY: {
    COMPLAINTS: '/authority/complaints',
    COMPLAINT_DETAIL: (id: string) => `/authority/complaints/${id}`,
    UPDATE_STATUS: (id: string) => `/authority/complaints/${id}/status`,
    VERIFY: (id: string) => `/authority/complaints/${id}/verify`,
    DELETE_COMPLAINT: (id: string) => `/authority/complaints/${id}`,
  },
  AI: {
    DETECT: '/ai/detect',
  },
  UPLOADS: {
    IMAGE: '/uploads/image',
  },
};
