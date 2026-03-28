import api from './api';

export const getSessions        = (params) => api.get('/sessions', { params });
export const getSession         = (id)     => api.get(`/sessions/${id}`);
export const createSession      = (data)   => api.post('/sessions', data);
export const updateSession      = (id, data) => api.patch(`/sessions/${id}`, data);
export const deleteSession      = (id)     => api.delete(`/sessions/${id}`);
export const getSessionDashboard= ()       => api.get('/sessions/dashboard');