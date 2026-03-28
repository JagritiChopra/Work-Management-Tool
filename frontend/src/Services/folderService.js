import api from './api';

export const getFolders   = ()         => api.get('/folders');
export const getFolderTree= ()         => api.get('/folders/tree');
export const createFolder = (data)     => api.post('/folders', data);
export const updateFolder = (id, data) => api.patch(`/folders/${id}`, data);
export const deleteFolder = (id)       => api.delete(`/folders/${id}`);
export const moveFolder   = (id, data) => api.patch(`/folders/${id}/move`, data);