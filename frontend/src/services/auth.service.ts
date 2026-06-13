import api from './api';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import type { AuthResponse } from '../types';

export const authService = {
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  googleLogin: (idToken: string) =>
    api.post<AuthResponse>('/auth/google', { id_token: idToken }),

  refresh: () =>
    axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true }),

  logout: () =>
    api.post('/auth/logout'),

  logoutAll: () =>
    api.post('/auth/logout-all'),

  verifyEmail: (token: string) =>
    api.post(`/auth/verify-email?token=${token}`),

  setPassword: (password: string) =>
    api.post('/auth/set-password', { password }),

  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
};
