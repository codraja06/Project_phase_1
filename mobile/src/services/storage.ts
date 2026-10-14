import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@civic_auth_token';
const USER_KEY = '@civic_auth_user';
const SERVER_URL_KEY = '@civic_server_url';

export const storageService = {
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<any | null> {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },

  async clearSession(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },

  async setCustomServerUrl(url: string): Promise<void> {
    await AsyncStorage.setItem(SERVER_URL_KEY, url.trim().replace(/\/$/, ''));
  },

  async getCustomServerUrl(): Promise<string | null> {
    return await AsyncStorage.getItem(SERVER_URL_KEY);
  },

  async removeCustomServerUrl(): Promise<void> {
    await AsyncStorage.removeItem(SERVER_URL_KEY);
  },
};
