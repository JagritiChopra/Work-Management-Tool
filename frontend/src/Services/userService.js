import api from './api';

export const updateProfile = (data)   => api.patch('/profile', data);
export const uploadAvatar  = (file)   => {
  const form = new FormData();
  form.append('avatar', file);
  return api.post('/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const deleteAvatar  = ()       => api.delete('/profile/avatar');
export const deleteAccount = (password) => api.delete('/profile/account', { data: { password } });