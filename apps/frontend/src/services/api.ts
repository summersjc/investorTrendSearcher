import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API client with typed methods
export const api = {
  // Health
  health: () => apiClient.get('/'),

  // Search
  search: {
    all: (query: string, limit?: number) =>
      apiClient.get('/search', { params: { q: query, limit } }),
    investors: (query: string, limit?: number) =>
      apiClient.get('/search/investors', { params: { q: query, limit } }),
    companies: (query: string, limit?: number) =>
      apiClient.get('/search/companies', { params: { q: query, limit } }),
  },

  // Investors
  investors: {
    list: (params?: any) => apiClient.get('/investors', { params }),
    get: (id: string) => apiClient.get(`/investors/${id}`),
    getBySlug: (slug: string) => apiClient.get(`/investors/slug/${slug}`),
    create: (data: any) => apiClient.post('/investors', data),
    update: (id: string, data: any) => apiClient.put(`/investors/${id}`, data),
    delete: (id: string) => apiClient.delete(`/investors/${id}`),
    enrich: (id: string) => apiClient.post(`/investors/${id}/enrich`),
    getPortfolio: (id: string) => apiClient.get(`/investors/${id}/portfolio`),
  },

  // Companies
  companies: {
    list: (params?: any) => apiClient.get('/companies', { params }),
    get: (id: string) => apiClient.get(`/companies/${id}`),
    getBySlug: (slug: string) => apiClient.get(`/companies/slug/${slug}`),
    getByTicker: (ticker: string) => apiClient.get(`/companies/ticker/${ticker}`),
    create: (data: any) => apiClient.post('/companies', data),
    update: (id: string, data: any) => apiClient.put(`/companies/${id}`, data),
    delete: (id: string) => apiClient.delete(`/companies/${id}`),
    enrich: (id: string) => apiClient.post(`/companies/${id}/enrich`),
    getFunding: (id: string) => apiClient.get(`/companies/${id}/funding`),
    getInvestors: (id: string) => apiClient.get(`/companies/${id}/investors`),
    isStale: (id: string) => apiClient.get(`/companies/${id}/stale`),
  },

  // Investments
  investments: {
    list: (params?: any) => apiClient.get('/investments', { params }),
    get: (id: string) => apiClient.get(`/investments/${id}`),
    create: (data: any) => apiClient.post('/investments', data),
    update: (id: string, data: any) => apiClient.put(`/investments/${id}`, data),
    delete: (id: string) => apiClient.delete(`/investments/${id}`),
    statistics: () => apiClient.get('/investments/statistics'),
  },

  // Connections
  connections: {
    discover: () => apiClient.post('/connections/discover'),
    getInvestorNetwork: (id: string, minStrength?: number) =>
      apiClient.get(`/connections/investors/${id}/network`, { params: { minStrength } }),
    getCompanyNetwork: (id: string) => apiClient.get(`/connections/companies/${id}/network`),
    getPotentialInvestors: (id: string, limit?: number) =>
      apiClient.get(`/connections/companies/${id}/potential-investors`, { params: { limit } }),
    statistics: () => apiClient.get('/connections/statistics'),
  },

  // Import/Export
  importExport: {
    importInvestors: (data: any[]) =>
      apiClient.post('/import-export/import/investors', data),
    importCompanies: (data: any[]) =>
      apiClient.post('/import-export/import/companies', data),
    importInvestments: (data: any[]) =>
      apiClient.post('/import-export/import/investments', data),
    exportAll: () => apiClient.get('/import-export/export/all'),
    exportInvestors: (format: 'json' | 'csv' = 'json') =>
      apiClient.get('/import-export/export/investors', { params: { format } }),
    exportCompanies: (format: 'json' | 'csv' = 'json') =>
      apiClient.get('/import-export/export/companies', { params: { format } }),
    exportInvestments: (format: 'json' | 'csv' = 'json') =>
      apiClient.get('/import-export/export/investments', { params: { format } }),
  },
};
