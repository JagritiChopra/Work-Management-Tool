import api from './api';

export const getTasks         = (params) => api.get('/tasks', { params });
export const getTask          = (id)     => api.get(`/tasks/${id}`);
export const createTask       = (data)   => api.post('/tasks', data);
export const updateTask       = (id, data) => api.patch(`/tasks/${id}`, data);
export const deleteTask       = (id)     => api.delete(`/tasks/${id}`);
export const getKanban        = ()       => api.get('/tasks/kanban');
export const bulkUpdateStatus = (data)   => api.patch('/tasks/bulk-status', data);