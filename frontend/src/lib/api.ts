import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// Types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface QRScanResponse {
  shop: any;
  redirect_url: string;
  modules: string[];
  features: string[];
  ui_theme: string;
}

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = Cookies.get('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      const message = error.response?.data?.message || error.message || 'An error occurred';
      
      // Handle specific error codes
      if (error.response?.status === 401) {
        // Unauthorized - clear token and redirect to login
        Cookies.remove('auth_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } else if (error.response?.status === 429) {
        toast.error('Too many requests. Please try again later.');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      }

      return Promise.reject(error);
    }
  );

  return client;
};

const api = createApiClient();

// Shop API methods
export const shopApi = {
  // Scan QR code
  scanQR: async (qrCode: string): Promise<ApiResponse<QRScanResponse>> => {
    const response = await api.post('/api/shops/scan-qr', {
      qr_data: qrCode
    });
    return response.data;
  },

  // Get shop by slug
  getShop: async (slug: string): Promise<ApiResponse> => {
    const response = await api.get(`/api/shops/${slug}`);
    return response.data;
  },

  // Get shop configuration
  getShopConfig: async (slug: string): Promise<ApiResponse> => {
    const response = await api.get(`/api/shops/${slug}/config`);
    return response.data;
  },

  // Get shop modules
  getShopModules: async (slug: string): Promise<ApiResponse> => {
    const response = await api.get(`/api/shops/${slug}/modules`);
    return response.data;
  },

  // Generate QR code
  generateQRCode: async (slug: string): Promise<ApiResponse> => {
    const response = await api.get(`/api/shops/${slug}/qr-code`);
    return response.data;
  },

  // Update shop settings
  updateSettings: async (slug: string, settings: any): Promise<ApiResponse> => {
    const response = await api.put(`/api/shops/${slug}/settings`, settings);
    return response.data;
  },

  // Update module
  updateModule: async (
    slug: string,
    moduleName: string,
    data: { is_enabled: boolean; configuration?: any }
  ): Promise<ApiResponse> => {
    const response = await api.put(`/api/shops/${slug}/modules/${moduleName}`, data);
    return response.data;
  },

  // Get analytics
  getAnalytics: async (
    slug: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get(`/api/shops/${slug}/analytics?${params}`);
    return response.data;
  }
};

// Products API (for supermarket, tea stall)
export const productsApi = {
  getProducts: async (shopSlug: string, params?: any): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams(params);
    const response = await api.get(`/api/shops/${shopSlug}/products?${queryParams}`);
    return response.data;
  },

  getProduct: async (shopSlug: string, productId: string): Promise<ApiResponse> => {
    const response = await api.get(`/api/shops/${shopSlug}/products/${productId}`);
    return response.data;
  },

  createProduct: async (shopSlug: string, product: any): Promise<ApiResponse> => {
    const response = await api.post(`/api/shops/${shopSlug}/products`, product);
    return response.data;
  },

  updateProduct: async (shopSlug: string, productId: string, product: any): Promise<ApiResponse> => {
    const response = await api.put(`/api/shops/${shopSlug}/products/${productId}`, product);
    return response.data;
  },

  deleteProduct: async (shopSlug: string, productId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/shops/${shopSlug}/products/${productId}`);
    return response.data;
  }
};

// Services API (for saloon, medical, hotel)
export const servicesApi = {
  getServices: async (shopSlug: string, params?: any): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams(params);
    const response = await api.get(`/api/shops/${shopSlug}/services?${queryParams}`);
    return response.data;
  },

  getService: async (shopSlug: string, serviceId: string): Promise<ApiResponse> => {
    const response = await api.get(`/api/shops/${shopSlug}/services/${serviceId}`);
    return response.data;
  },

  createService: async (shopSlug: string, service: any): Promise<ApiResponse> => {
    const response = await api.post(`/api/shops/${shopSlug}/services`, service);
    return response.data;
  },

  updateService: async (shopSlug: string, serviceId: string, service: any): Promise<ApiResponse> => {
    const response = await api.put(`/api/shops/${shopSlug}/services/${serviceId}`, service);
    return response.data;
  },

  deleteService: async (shopSlug: string, serviceId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/shops/${shopSlug}/services/${serviceId}`);
    return response.data;
  }
};

// Orders API
export const ordersApi = {
  getOrders: async (shopSlug: string, params?: any): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams(params);
    const response = await api.get(`/api/shops/${shopSlug}/orders?${queryParams}`);
    return response.data;
  },

  getOrder: async (shopSlug: string, orderId: string): Promise<ApiResponse> => {
    const response = await api.get(`/api/shops/${shopSlug}/orders/${orderId}`);
    return response.data;
  },

  createOrder: async (shopSlug: string, order: any): Promise<ApiResponse> => {
    const response = await api.post(`/api/shops/${shopSlug}/orders`, order);
    return response.data;
  },

  updateOrder: async (shopSlug: string, orderId: string, updates: any): Promise<ApiResponse> => {
    const response = await api.put(`/api/shops/${shopSlug}/orders/${orderId}`, updates);
    return response.data;
  },

  cancelOrder: async (shopSlug: string, orderId: string): Promise<ApiResponse> => {
    const response = await api.patch(`/api/shops/${shopSlug}/orders/${orderId}/cancel`);
    return response.data;
  }
};

// Bookings API (for saloon, hotel, medical)
export const bookingsApi = {
  getBookings: async (shopSlug: string, params?: any): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams(params);
    const response = await api.get(`/api/shops/${shopSlug}/bookings?${queryParams}`);
    return response.data;
  },

  getBooking: async (shopSlug: string, bookingId: string): Promise<ApiResponse> => {
    const response = await api.get(`/api/shops/${shopSlug}/bookings/${bookingId}`);
    return response.data;
  },

  createBooking: async (shopSlug: string, booking: any): Promise<ApiResponse> => {
    const response = await api.post(`/api/shops/${shopSlug}/bookings`, booking);
    return response.data;
  },

  updateBooking: async (shopSlug: string, bookingId: string, updates: any): Promise<ApiResponse> => {
    const response = await api.put(`/api/shops/${shopSlug}/bookings/${bookingId}`, updates);
    return response.data;
  },

  cancelBooking: async (shopSlug: string, bookingId: string): Promise<ApiResponse> => {
    const response = await api.patch(`/api/shops/${shopSlug}/bookings/${bookingId}/cancel`);
    return response.data;
  },

  getAvailableSlots: async (shopSlug: string, params: any): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams(params);
    const response = await api.get(`/api/shops/${shopSlug}/bookings/available-slots?${queryParams}`);
    return response.data;
  }
};

// Customers API
export const customersApi = {
  getCustomers: async (shopSlug: string, params?: any): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams(params);
    const response = await api.get(`/api/shops/${shopSlug}/customers?${queryParams}`);
    return response.data;
  },

  getCustomer: async (shopSlug: string, customerId: string): Promise<ApiResponse> => {
    const response = await api.get(`/api/shops/${shopSlug}/customers/${customerId}`);
    return response.data;
  },

  createCustomer: async (shopSlug: string, customer: any): Promise<ApiResponse> => {
    const response = await api.post(`/api/shops/${shopSlug}/customers`, customer);
    return response.data;
  },

  updateCustomer: async (shopSlug: string, customerId: string, customer: any): Promise<ApiResponse> => {
    const response = await api.put(`/api/shops/${shopSlug}/customers/${customerId}`, customer);
    return response.data;
  }
};

// File upload utility
export const uploadFile = async (file: File, folder: string = 'general'): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data.url;
};

// WebSocket connection for real-time updates
export const connectWebSocket = (shopId: number) => {
  if (typeof window === 'undefined') return null;

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
  const token = Cookies.get('auth_token');

  const ws = new WebSocket(`${wsUrl}?token=${token}&shopId=${shopId}`);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
};

export default api;