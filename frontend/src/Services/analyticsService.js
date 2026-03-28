import api from './api';

export const getDashboardAnalytics = () => api.get('/analytics/dashboard');
export const getTaskAnalytics      = () => api.get('/analytics/tasks');
export const getSessionAnalytics   = () => api.get('/analytics/sessions');
