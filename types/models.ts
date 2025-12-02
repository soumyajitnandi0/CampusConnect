// Type definitions for data models

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'organizer';
  rollNo?: string;
  yearSection?: string;
  pushToken?: string;
  points?: number;
  badges?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  organizer: string; // User ID
  organizerName?: string;
  rsvps: string[]; // Array of user IDs
  checkedIn: string[]; // Array of user IDs
  rsvpCount: number;
  category?: string;
  imageUrl?: string;
  qrCodeToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RSVP {
  id: string;
  user: string; // User ID
  event: string; // Event ID
  status: 'going' | 'maybe' | 'not_going';
  attended: boolean;
  createdAt: Date;
}

export interface Feedback {
  id: string;
  user: string; // User ID
  event: string; // Event ID
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

export interface CheckIn {
  id: string;
  user: string; // User ID
  event: string; // Event ID
  checkInTime: Date; // Exact check-in date and time
  qrData?: QRCodeData; // Original QR code data
  createdAt: Date;
}

export interface QRCodeData {
  userId: string;
  eventId: string;
  timestamp: number;
}

export interface EventStats {
  totalRSVPs: number;
  attended: number;
  avgRating: number;
  feedbackCount: number;
}

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

