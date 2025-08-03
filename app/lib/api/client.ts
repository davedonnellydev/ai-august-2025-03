import OpenAI from 'openai';
import { RequestConfig } from './types';

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor(baseUrl: string, headers?: Record<string, string>, timeout: number = 10000) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    this.defaultTimeout = timeout;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & Omit<RequestConfig, 'cache'> = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout || this.defaultTimeout;

    const config: RequestInit = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
      }

      throw new Error('An unexpected error occurred');
    }
  }

  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'cache'>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...config });
  }

  async post<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'cache'>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  async put<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'cache'>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'cache'>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...config });
  }
}

export const OpenAIResponsesAPI = (input: string) => {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = client.responses.create({
    model: 'gpt-4.1',
    input,
  });
  return response;
};
