/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Service, Booking, AppNotification, BlockedTime } from './types.js';

const API_BASE = '/api';

// Helper to set authorization token
let authToken = localStorage.getItem('booking_auth_token') || '';

export function setToken(token: string) {
  authToken = token;
  if (token) {
    localStorage.setItem('booking_auth_token', token);
  } else {
    localStorage.removeItem('booking_auth_token');
  }
}

export function getToken() {
  return authToken;
}

// Global API Request handler
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Server request failed');
  }

  return data as T;
}

export const api = {
  // Auth
  registerLogin: (body: {
    email: string;
    name?: string;
    role: 'provider' | 'client';
    isRegister: boolean;
    phone?: string;
    industry?: string;
  }) => {
    return request<{ message: string; user: User; token: string }>('/auth/register-login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  sendOTP: (phone: string) => {
    return request<{ success: boolean; message: string; otp: string }>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  },

  verifyOTP: (body: {
    phone: string;
    code: string;
    name?: string;
    role: 'provider' | 'client';
    isRegister: boolean;
    industry?: string;
  }) => {
    return request<{ message: string; user: User; token: string }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  // Providers
  getProviders: () => {
    return request<User[]>('/providers');
  },

  getProviderByUsername: (username: string) => {
    return request<{ provider: User; services: Service[] }>(`/providers/${username}`);
  },

  getProviderServices: (providerId: string) => {
    return request<Service[]>(`/providers/${providerId}/services`);
  },

  updateProviderProfile: (providerId: string, body: {
    name?: string;
    industry?: string;
    bio?: string;
    availability?: any;
    username?: string;
  }) => {
    return request<User>(`/providers/${providerId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  // Blocked Times
  getBlockedTimes: (providerId: string) => {
    return request<BlockedTime[]>(`/providers/${providerId}/blocked-times`);
  },

  addBlockedTime: (providerId: string, body: {
    date: string;
    startTime?: string;
    endTime?: string;
    allDay: boolean;
    label: string;
  }) => {
    return request<BlockedTime>(`/providers/${providerId}/blocked-times`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  deleteBlockedTime: (id: string) => {
    return request<{ success: boolean }>((`/providers/blocked-times/${id}`), {
      method: 'DELETE'
    });
  },

  // Services CRUD
  createService: (body: {
    providerId: string;
    name: string;
    duration: number;
    price: number;
    description: string;
  }) => {
    return request<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  updateService: (id: string, body: Partial<Service>) => {
    return request<Service>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  deleteService: (id: string) => {
    return request<{ success: boolean; message: string }>(`/services/${id}`, {
      method: 'DELETE'
    });
  },

  // Slots computation Solver
  getAvailableSlots: (providerId: string, date: string, serviceId: string) => {
    return request<{ slots: Array<{ startTime: string; endTime: string }> }>(
      `/providers/${providerId}/slots?date=${date}&serviceId=${serviceId}`
    );
  },

  // Bookings
  getBookings: (query: { userId?: string; role?: 'provider' | 'client'; email?: string }) => {
    const params = new URLSearchParams();
    if (query.userId) params.append('userId', query.userId);
    if (query.role) params.append('role', query.role);
    if (query.email) params.append('email', query.email);
    return request<Booking[]>(`/bookings?${params.toString()}`);
  },

  createBooking: (body: {
    providerId: string;
    serviceId: string;
    clientId: string | null;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientNote?: string;
    date: string;
    startTime: string;
  }) => {
    return request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  updateBookingStatus: (id: string, body: { status: 'confirmed' | 'canceled'; note?: string }) => {
    return request<Booking>(`/bookings/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  rescheduleBooking: (id: string, body: { date: string; startTime: string }) => {
    return request<Booking>(`/bookings/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  // Waitlist APIs
  joinWaitlist: (body: {
    providerId: string;
    serviceId: string;
    clientId: string | null;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientNote?: string;
    date: string;
  }) => {
    return request<any>('/waitlist', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  getWaitlist: (query: { providerId?: string; email?: string }) => {
    const params = new URLSearchParams();
    if (query.providerId) params.append('providerId', query.providerId);
    if (query.email) params.append('email', query.email);
    return request<any[]>(`/waitlist?${params.toString()}`);
  },

  // Notifications
  getNotifications: (query: { userId?: string; email?: string }) => {
    const params = new URLSearchParams();
    if (query.userId) params.append('userId', query.userId);
    if (query.email) params.append('email', query.email);
    return request<AppNotification[]>(`/notifications?${params.toString()}`);
  },

  markNotificationRead: (id: string) => {
    return request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'POST'
    });
  }
};
