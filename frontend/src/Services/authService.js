import api from './api';

export const register     = (data) => api.post('/auth/register', data);
export const login        = (data) => api.post('/auth/login', data);
export const logout       = ()     => api.post('/auth/logout');
export const getMe        = ()     => api.get('/auth/me');
export const refreshToken = ()     => api.post('/auth/refresh');

export const verifyEmail         = (token)  => api.get(`/auth/verify-email/${token}`);
export const resendVerification  = (email)  => api.post('/auth/resend-verification', { email });
export const forgotPassword      = (email)  => api.post('/auth/forgot-password', { email });
export const resetPassword       = (token, data) => api.patch(`/auth/reset-password/${token}`, data);
export const changePassword      = (data)   => api.patch('/auth/change-password', data);