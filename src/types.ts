/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProviderProfile {
  username: string; // Used for /book/:username
  industry: string;
  bio?: string;
  availability: Availability;
}

export interface Availability {
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "HH:MM" in local/provider time
  endTime: string; // "HH:MM"
  breakStartTime?: string; // "HH:MM"
  breakEndTime?: string; // "HH:MM"
}

export interface BlockedTime {
  id: string;
  providerId: string;
  date: string; // "YYYY-MM-DD"
  startTime?: string; // "HH:MM"
  endTime?: string; // "HH:MM"
  allDay: boolean;
  label: string;
}

export interface Service {
  id: string;
  providerId: string;
  name: string;
  duration: number; // in minutes
  price: number; // 0 means Free
  description: string;
}

export interface Booking {
  id: string;
  providerId: string;
  serviceId: string;
  clientId: string | null; // Null if guest booking
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNote?: string;
  date: string; // "YYYY-MM-DD" in UTC/standard format
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  status: 'pending' | 'confirmed' | 'canceled';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string | null; // Target user ID if logged in
  userEmail?: string; // Target email for guests or providers
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  role: 'provider' | 'client';
  name: string;
  providerProfile?: ProviderProfile;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  providerId: string;
  serviceId: string;
  clientId: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNote?: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}
