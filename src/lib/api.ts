/**
 * Unified API Client
 * Handles all API calls to the backend with automatic authentication
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// Message interface
interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profilePhoto?: string;
  };
  recipient: {
    _id: string;
    name: string;
    profilePhoto?: string;
  };
  content: string;
  timestamp: string;
  read: boolean;
}

class ApiClient {
  private getAuthHeaders(contentType: string = 'application/json'): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};

    // Only set Content-Type when explicitly provided (e.g., JSON).
    // For FormData requests, let the browser set the multipart boundary.
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    
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
      
      // Only redirect if we're not already on an auth-related page
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/signin' || currentPath === '/signup' || currentPath === '/auth';
      
      if (!isAuthPage) {
        // Use the navigate function if available, otherwise fallback to hash navigation
        window.location.hash = 'auth';
      }
      
      throw new Error('Unauthorized');
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // If not JSON, try to get text to see what we got
      const text = await response.text();
      console.error('Non-JSON response received:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        url: response.url,
        preview: text.substring(0, 200)
      });
      
      return {
        success: false,
        message: `Server returned ${response.status} ${response.statusText}. Expected JSON but got ${contentType || 'unknown'}. Please check the server logs.`,
      };
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      return {
        success: false,
        message: 'Failed to parse server response. Please check the server logs.',
      };
    }
    
    // For error responses, extract message from data
    const responseData = data.data || data;
    const responseMessage = data.message || (response.ok ? undefined : `Server returned ${response.status} ${response.statusText}`);
    
    return {
      success: response.ok,
      data: responseData,
      message: responseMessage,
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

  async post<T = any>(path: string, body: any, options?: { headers?: HeadersInit }): Promise<ApiResponse<T>> {
    try {
      // For FormData (file uploads), let the browser set Content-Type automatically
      const isFormData = body instanceof FormData;
      const defaultHeaders = isFormData ? this.getAuthHeadersWithoutContentType() : this.getAuthHeaders();
      const headers = { ...defaultHeaders, ...options?.headers };
      
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: isFormData ? body : JSON.stringify(body),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Helper method to get auth headers without Content-Type (for FormData)
  private getAuthHeadersWithoutContentType(): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async put<T = any>(path: string, body: any): Promise<ApiResponse<T>> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(isFormData ? undefined : 'application/json'),
        body: isFormData ? body : JSON.stringify(body),
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
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(isFormData ? undefined : 'application/json'),
        body: isFormData ? body : JSON.stringify(body),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Message-specific methods
  async getConversation(userId: string): Promise<ApiResponse<Message[]>> {
    return this.get<Message[]>(`/messages/conversation/${userId}`);
  }

  async sendMessage(recipient: string, content: string): Promise<ApiResponse<Message>> {
    return this.post<Message>('/messages', { recipient, content });
  }

  // Get all conversation lists for the user
  async getUserConversations(): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/messages/conversations');
  }

  // Delete conversation records between user and specific user
  async deleteConversation(userId: string): Promise<ApiResponse<any>> {
    return this.del<any>(`/messages/conversation/${userId}`);
  }

  // Mark conversation with specific user as read
  async markConversationAsRead(userId: string): Promise<ApiResponse<any>> {
    return this.put<any>(`/messages/conversation/${userId}/read`, {});
  }

  // Get user details
  async getUserDetails(userId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/users/${userId}`);
  }
}

export const api = new ApiClient();
