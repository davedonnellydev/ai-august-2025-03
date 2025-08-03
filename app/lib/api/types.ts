// Common API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  status: number;
  details?: any;
}

// Request configuration
export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

// Proxy configuration
export interface ProxyConfig {
  target: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}
