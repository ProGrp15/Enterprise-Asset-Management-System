import { NOTIFICATION_API } from './api';
const unwrap = (r) => r.data?.data ?? r.data;
export const notifications = { list: async () => unwrap(await NOTIFICATION_API.get('/notification')), create: async (b) => unwrap(await NOTIFICATION_API.post('/notification', b)), update: async (id) => unwrap(await NOTIFICATION_API.put(`/notification/read/${id}`)), remove: async (id) => unwrap(await NOTIFICATION_API.delete(`/notification/${id}`)), markRead: async (id) => unwrap(await NOTIFICATION_API.put(`/notification/read/${id}`)), markAllRead: async () => unwrap(await NOTIFICATION_API.put('/notification/read-all')) };
export const auditLogs = { list: async () => unwrap(await NOTIFICATION_API.get('/audit')), create: async (b) => unwrap(await NOTIFICATION_API.post('/audit', b)), update: async () => null, remove: async () => null };
export const getNotificationDashboard = async () => unwrap(await NOTIFICATION_API.get('/dashboard'));
export const getReport = async (type) => unwrap(await NOTIFICATION_API.get(`/report/${type}`));
export const askAssistant = async (message, conversationId) => unwrap(await NOTIFICATION_API.post('/ai/chat', { message, conversationId }));
export const sendEmail = async (body) => unwrap(await NOTIFICATION_API.post('/email/send', body));
