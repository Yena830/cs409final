/**
 * Unified API Client
 * Handles all API calls to the backend with automatic authentication
 */

const BASE_URL = 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (response.status === 401) {
      // Unauthorized - clear token and redirect to auth
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.hash !== '#auth') {
        window.location.hash = 'auth';
      }
      throw new Error('Unauthorized');
    }

    const data = await response.json();
    
    return {
      success: response.ok,
      data: data.data || data,
      message: data.message,
    };
  }

  async get<T = any>(path: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async post<T = any>(path: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async put<T = any>(path: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async del<T = any>(path: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async patch<T = any>(path: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}

export const api = new ApiClient();

