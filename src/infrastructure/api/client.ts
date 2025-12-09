import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { storage } from '../../../utils/storage';
import { config } from '../../config';
import {
    AppError,
    AuthenticationError,
    AuthorizationError,
    NetworkError,
    NotFoundError,
    ServerError,
    ValidationError,
} from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * API Client with error handling and interceptors
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseURL,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await storage.getItem('token');
          if (token) {
            // Verify token format (JWT should have 3 parts)
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
              logger.error('Invalid token format detected, clearing token', { 
                url: config.url,
                tokenLength: token.length,
                tokenPreview: token.substring(0, 20) + '...'
              });
              // Clear invalid token
              await storage.removeItem('token');
              throw new Error('Invalid token format');
            }

            config.headers['x-auth-token'] = token;
            
            // Decode token to check its type (for debugging)
            try {
              // Decode base64 payload (works in both Node and browser)
              const base64Url = tokenParts[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(atob(base64));
              const tokenType = payload.user?.id ? 'JWT' : payload.email ? 'Supabase' : 'Unknown';
              
              logger.debug('Token added to request', { 
                url: config.url,
                hasToken: !!token,
                tokenLength: token.length,
                tokenType,
                hasUserId: !!payload.user?.id,
                userId: payload.user?.id
              });

              // Warn if we're using a Supabase token for non-sync endpoints
              if (tokenType === 'Supabase' && !config.url?.includes('/auth/sync')) {
                logger.warn('Using Supabase token for non-sync endpoint - this may cause 401 errors', {
                  url: config.url
                });
              }
            } catch (decodeError) {
              logger.debug('Token added to request (could not decode payload)', { 
                url: config.url,
                hasToken: !!token,
                tokenLength: token.length 
              });
            }
          } else {
            logger.warn('No token found in storage for request', { url: config.url });
          }
        } catch (error) {
          logger.error('Error getting token from storage', error);
        }
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Handle success response
        return response;
      },
      async (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  private async handleError(error: AxiosError): Promise<never> {
    // Network error (no response)
    if (!error.response) {
      logger.error('Network error', error);
      return Promise.reject(new NetworkError());
    }

    const { status, data } = error.response;
    const message = (data as any)?.error || (data as any)?.msg || error.message;

    logger.error('API error', error, {
      status,
      message,
      url: error.config?.url,
    });

    // Handle 401 errors - token might be invalid or expired
    if (status === 401) {
      // Check if token is a Supabase token (should be JWT after sync)
      try {
        const token = await storage.getItem('token');
        if (token) {
          const parts = token.split('.');
          if (parts.length === 3) {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            
            // If it's a Supabase token (has email but no user.id), clear it
            if (payload.email && !payload.user?.id) {
              logger.warn('401 error with Supabase token - clearing invalid token');
              await storage.removeItem('token');
              await storage.removeItem('user');
            }
          } else {
            // Invalid token format - clear it
            logger.warn('401 error with invalid token format - clearing token');
            await storage.removeItem('token');
            await storage.removeItem('user');
          }
        }
      } catch (e) {
        logger.error('Error checking token on 401', e);
      }
      
      return Promise.reject(new AuthenticationError(message));
    }

    switch (status) {
      case 403:
        return Promise.reject(new AuthorizationError(message));
      case 400:
        const errors = (data as any)?.errors;
        return Promise.reject(new ValidationError(message, errors));
      case 404:
        return Promise.reject(new NotFoundError(message));
      case 500:
      case 502:
      case 503:
        return Promise.reject(new ServerError(message));
      default:
        return Promise.reject(new AppError(message, 'API_ERROR', status));
    }
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return this.extractData(response);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return this.extractData(response);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return this.extractData(response);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return this.extractData(response);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return this.extractData(response);
  }

  // Handle file uploads
  async upload<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progress: number) => void
  ): Promise<T> {
    // Don't set Content-Type header - let axios automatically detect FormData
    // and set Content-Type with boundary (important for React Native FormData)
    const response = await this.client.post<T>(url, formData, {
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      },
    });
    return this.extractData(response);
  }

  // Extract data from response (handles both { data: {...} } and direct response)
  private extractData<T>(response: AxiosResponse<T>): T {
    const responseData = response.data as any;
    // If backend returns { success: true, data: {...} }, extract data
    if (responseData && responseData.success && responseData.data) {
      return responseData.data;
    }
    // Otherwise return the response data directly
    return responseData;
  }

  // Get raw axios instance if needed
  getRawClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient;

