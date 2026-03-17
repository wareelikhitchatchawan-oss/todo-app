import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getTasks = (userId, filters = {}) =>
  api.get(`/users/${userId}/tasks`, { params: filters }).then(r => r.data);

export const createTask = (data) =>
  api.post('/tasks', data).then(r => r.data);

export const updateTask = (id, data) =>
  api.put(`/tasks/${id}`, data).then(r => r.data);

export const updateTaskStatus = (id, status) =>
  api.patch(`/tasks/${id}/status`, { status }).then(r => r.data);

export const deleteTask = (id) =>
  api.delete(`/tasks/${id}`).then(r => r.data);

export const getGroups = (userId) =>
  api.get(`/users/${userId}/groups`).then(r => r.data);

export const createGroup = (data) =>
  api.post('/groups', data).then(r => r.data);

export const deleteGroup = (id) =>
  api.delete(`/groups/${id}`).then(r => r.data);

export const getStats = (userId) =>
  api.get(`/users/${userId}/stats`).then(r => r.data);

export const getUsers = () =>
  api.get('/users').then(r => r.data);

export const createUser = (data) =>
  api.post('/users', data).then(r => r.data);

export const login = (email, password) =>
  api.post('/login', { email, password }).then(r => r.data);