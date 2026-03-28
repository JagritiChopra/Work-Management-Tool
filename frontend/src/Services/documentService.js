import api from './api';

export const getDocuments   = (params) => api.get('/documents', { params });
export const getDocument    = (id)     => api.get(`/documents/${id}`);
export const uploadDocument = (file, meta) => {
  const form = new FormData();
  form.append('document', file);
  if (meta) Object.entries(meta).forEach(([k, v]) => form.append(k, v));
  return api.post('/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const updateDocument  = (id, data) => api.patch(`/documents/${id}`, data);
export const deleteDocument  = (id)       => api.delete(`/documents/${id}`);
export const replaceDocument = (id, file) => {
  const form = new FormData();
  form.append('document', file);
  return api.put(`/documents/${id}/file`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const moveDocument = (id, data) => api.patch(`/documents/${id}/move`, data);