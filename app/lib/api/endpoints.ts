import { ApiClient } from './client';

// Create API client instance
const apiClient = new ApiClient('/api/proxy');

// Example user API endpoints (ready for future use)
export const userApi = {
  getUsers: () => apiClient.get('/users'),
  getUser: (id: number) => apiClient.get(`/users/${id}`),
  createUser: (user: any) => apiClient.post('/users', user),
  updateUser: (id: number, user: any) => apiClient.put(`/users/${id}`, user),
  deleteUser: (id: number) => apiClient.delete(`/users/${id}`),
};

// Example product API endpoints (ready for future use)
export const productApi = {
  getProducts: () => apiClient.get('/products'),
  getProduct: (id: number) => apiClient.get(`/products/${id}`),
  createProduct: (product: any) => apiClient.post('/products', product),
  updateProduct: (id: number, product: any) => apiClient.put(`/products/${id}`, product),
  deleteProduct: (id: number) => apiClient.delete(`/products/${id}`),
};

// Generic API helper for custom endpoints
export const api = {
  get: <T>(endpoint: string) => apiClient.get<T>(endpoint),
  post: <T>(endpoint: string, data?: any) => apiClient.post<T>(endpoint, data),
  put: <T>(endpoint: string, data?: any) => apiClient.put<T>(endpoint, data),
  delete: <T>(endpoint: string) => apiClient.delete<T>(endpoint),
};
