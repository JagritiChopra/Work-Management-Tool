import api from './api';

export const getCalendarTasks  = (params) => api.get('/calendar', { params });   // ?start=&end=
export const getTasksByDate    = (date)   => api.get(`/calendar/date/${date}`);  // ISO date
export const getCalendarTask   = (id)     => api.get(`/calendar/${id}`);
export const createCalendarTask= (data)   => api.post('/calendar', data);
export const updateCalendarTask= (id, data) => api.patch(`/calendar/${id}`, data);
export const deleteCalendarTask= (id)     => api.delete(`/calendar/${id}`);