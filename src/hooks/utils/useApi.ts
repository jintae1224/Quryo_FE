'use client';

import { useCallback } from 'react';

import type { ApiResponse } from '@/types';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 10000; // 10초
  private defaultRetries: number = 3;
  private defaultRetryDelay: number = 1000; // 1초

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithTimeout(
    url: string, 
    options: RequestOptions
  ): Promise<Response> {
    const { timeout = this.defaultTimeout, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    // JSON 응답이 아닌 경우
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new ApiError({
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        });
      }
      
      // 빈 응답 처리
      const text = await response.text();
      return (text ? JSON.parse(text) : {}) as T;
    }

    // JSON 응답 파싱
    const data: ApiResponse<T> = await response.json();

    // API 응답 형식 검증
    if (typeof data.success !== 'boolean') {
      throw new ApiError({
        message: 'Invalid API response format',
        status: response.status,
      });
    }

    // API 에러 응답
    if (!data.success) {
      throw new ApiError({
        message: data.message || 'API request failed',
        status: response.status,
        details: data,
      });
    }

    // HTTP 에러 상태
    if (!response.ok) {
      throw new ApiError({
        message: data.message || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        details: data,
      });
    }

    return data.data as T;
  }

  async request<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const { 
      retries = this.defaultRetries, 
      retryDelay = this.defaultRetryDelay,
      ...requestOptions 
    } = options;
    
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, requestOptions);
        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 마지막 시도이거나 재시도할 수 없는 에러
        if (attempt === retries || this.shouldNotRetry(error)) {
          throw lastError;
        }
        
        // 재시도 전 지연
        if (attempt < retries) {
          await this.sleep(retryDelay * Math.pow(2, attempt)); // 지수 백오프
        }
      }
    }

    throw lastError!;
  }

  private shouldNotRetry(error: unknown): boolean {
    if (error instanceof ApiError) {
      // 4xx 에러는 재시도하지 않음 (인증, 권한, 잘못된 요청)
      if (error.status && error.status >= 400 && error.status < 500) {
        return true;
      }
    }
    
    return false;
  }

  // Convenience methods
  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string, 
    data?: unknown, 
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string, 
    data?: unknown, 
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// API 클라이언트 싱글톤 인스턴스
const apiClient = new ApiClient();

export const useApi = () => {
  const get = useCallback(<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) => {
    return apiClient.get<T>(endpoint, options);
  }, []);

  const post = useCallback(<T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) => {
    return apiClient.post<T>(endpoint, data, options);
  }, []);

  const put = useCallback(<T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) => {
    return apiClient.put<T>(endpoint, data, options);
  }, []);

  const del = useCallback(<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) => {
    return apiClient.delete<T>(endpoint, options);
  }, []);

  return {
    get,
    post,
    put,
    delete: del,
  };
};