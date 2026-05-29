import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 10.0.2.2 is the host machine address when using Android Emulator.
// For a physical device, replace with your computer's local IP (e.g. 192.168.1.x).
const API_URL = 'http://10.0.2.2:3001/api';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 15000,
    });

    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.multiRemove(['authToken', 'user']);
        }
        return Promise.reject(error);
      }
    );
  }

  async setToken(token: string) {
    await AsyncStorage.setItem('authToken', token);
  }

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem('authToken');
  }

  async clearToken() {
    await AsyncStorage.multiRemove(['authToken', 'user']);
  }

  get(url: string, config?: any) {
    return this.client.get(url, config);
  }

  post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config);
  }

  put(url: string, data?: any, config?: any) {
    return this.client.put(url, data, config);
  }

  delete(url: string, config?: any) {
    return this.client.delete(url, config);
  }
}

export const apiClient = new APIClient();
