import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir el token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Servicios de Autenticación
export const authService = {
  login: (credenciales: any) => api.post('/auth/login', credenciales),
  getPerfil: () => api.get('/auth/profile'),
};

// Servicios de Sensores
export const sensorService = {
  listarTodos: () => api.get('/sensores'),
  obtenerDetalle: (id: string) => api.get(`/sensores/${id}`),
  obtenerPrediccion: (id: string) => api.get(`/sensores/${id}/prediccion`),
  
  // Admin
  crear: (data: any) => api.post('/admin/sensores', data),
  actualizar: (id: string, data: any) => api.put(`/admin/sensores/${id}`, data),
  eliminar: (id: string) => api.delete(`/admin/sensores/${id}`),
  actualizarUmbrales: (id: string, normal: number, alerta: number) => 
    api.put(`/admin/sensores/${id}/umbrales`, { umbral_normal_pct: normal, umbral_alerta_pct: alerta }),
  controlBomba: (accion: 'on' | 'off') => api.post(`/admin/bomba/${accion}`),
  obtenerUltimaLectura: (sensorId: string) => api.get(`/lecturas/historico/${sensorId}/last`),
};

// Servicios de Logs e Informes
export const logService = {
  obtenerLogs: (pagina = 1, limite = 50) => 
    api.get('/admin/logs', { params: { page: pagina, limit: limite } }),
    
  obtenerAlertas: (pagina = 1, limite = 50, filtros: any = {}) => 
    api.get('/lecturas/alertas', { 
      params: { 
        page: pagina, 
        limit: limite,
        ...filtros
      } 
    }),

  exportarAlertas: (filtros: any = {}) =>
    api.get('/lecturas/exportar', { 
      params: filtros, 
      responseType: 'blob' 
    }),
};

export const adminUserService = {
  listarTodos: () => api.get('/admin-users'),
  obtenerUno: (id: string) => api.get(`/admin-users/${id}`),
  crear: (data: any) => api.post('/admin-users', data),
  actualizar: (id: string, data: any) => api.patch(`/admin-users/${id}`, data),
  eliminar: (id: string) => api.delete(`/admin-users/${id}`),
};

// Servicios de Suscripciones y Cobertura (Admin)
export const notificationService = {
  obtenerResumen: () => api.get('/admin/notifications/stats'),
  obtenerActividad: () => api.get('/admin/notifications/activity'),
  obtenerCobertura: (pagina = 1, limite = 10, sensorId?: string) => 
    api.get('/admin/notifications/coverage', { params: { page: pagina, limit: limite, sensorId } }),
  obtenerInactivos: (dias = 30) => 
    api.get('/admin/notifications/inactive-devices', { params: { days: dias } }),
  descargarReporteInactivos: (dias = 30) => 
    api.get('/admin/notifications/export-inactive', { params: { days: dias }, responseType: 'text' }),
  obtenerListadoSuscriptores: () => 
    api.get('/admin/notifications/subscribers'),
};

export default api;
