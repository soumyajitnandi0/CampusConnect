import { QRCodeData } from '../types/models';
import { storage } from '../utils/storage';
import api from './api';

export class CheckInService {
  /**
   * Validate QR code data format
   */
  static validateQRData(data: any): data is QRCodeData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.userId === 'string' &&
      typeof data.eventId === 'string' &&
      typeof data.timestamp === 'number'
    );
  }

  /**
   * Check in user to an event using QR code
   */
  static async checkInUser(eventId: string, userId: string, qrData?: QRCodeData): Promise<void> {
    try {
      const token = await storage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Always send the QR token if available, as it contains validation data
      const payload: any = { 
        eventId,
      };
      
      if (qrData) {
        payload.qrToken = JSON.stringify(qrData);
      } else {
        // If no QR data, we can still check in using userId
        // But this should typically come from QR code
        payload.userId = userId;
      }

      console.log('Sending check-in request:', { eventId, hasQrToken: !!qrData });

      // API client automatically adds token via interceptor
      const response = await api.post('/attendance/verify', payload);

      console.log('Check-in response:', response);
      
      // API client extracts data, so response is already the data
      return response;
    } catch (error: any) {
      console.error('Check-in error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      const errorMessage = error.message || 'Failed to check in';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get check-in status for a user and event
   */
  static async getCheckInStatus(eventId: string, userId: string): Promise<{
    attended: boolean;
    checkInTime: Date | null;
    rsvpd: boolean;
  }> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.get(`/attendance/status/${eventId}/${userId}`);
      // API client extracts data, so response is already the data object
      return {
        attended: response.attended || false,
        checkInTime: response.checkInTime ? new Date(response.checkInTime) : null,
        rsvpd: response.rsvpd || false,
      };
    } catch (error) {
      return {
        attended: false,
        checkInTime: null,
        rsvpd: false,
      };
    }
  }

  /**
   * Get event attendance statistics
   */
  static async getEventAttendance(eventId: string): Promise<{
    totalRSVPs: number;
    checkedIn: number;
    attendanceRate: number;
  }> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.get(`/attendance/stats/${eventId}`);
      // API client extracts data, so response is already the data object
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch attendance');
    }
  }

  /**
   * Validate and check in user (combined operation)
   */
  static async validateAndCheckIn(qrDataString: string, eventId: string): Promise<void> {
    try {
      const qrData = JSON.parse(qrDataString);
      
      if (!this.validateQRData(qrData)) {
        throw new Error('Invalid QR code format');
      }

      if (qrData.eventId !== eventId) {
        throw new Error('QR code does not match this event');
      }

      // Check if QR code is expired (older than 24 hours)
      const age = Date.now() - qrData.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (age > maxAge) {
        throw new Error('QR code has expired');
      }

      await this.checkInUser(eventId, qrData.userId, qrData);
    } catch (error: any) {
      if (error.message) {
        throw error;
      }
      throw new Error('Invalid QR code');
    }
  }

  /**
   * Get user attendance records (all successfully checked-in events)
   */
  static async getUserAttendance(limit: number = 50, skip: number = 0): Promise<{
    records: Array<{
      id: string;
      checkInTime: Date;
      event: {
        id: string;
        title: string;
        description: string;
        date: Date;
        location: string;
        organizer: string;
        clubName?: string;
        category?: string;
        imageUrl?: string;
      };
    }>;
    total: number;
    limit: number;
    skip: number;
  }> {
    try {
      console.log('Fetching attendance records with limit:', limit, 'skip:', skip);

      // API client automatically adds token via interceptor
      const response = await api.get('/attendance/user', {
        params: { limit, skip },
      });

      // API client extracts data, so response is already the data object
      console.log('Attendance API response:', {
        recordsCount: response?.records?.length || 0,
        total: response?.total || 0,
        hasRecords: !!response?.records,
      });

      // Ensure we always return the expected structure
      if (!response || !Array.isArray(response.records)) {
        console.warn('Unexpected response structure:', response);
        return {
          records: [],
          total: 0,
          limit,
          skip,
        };
      }

      // Transform the response data
      const transformedData = {
        ...response,
        records: response.records.map((record: any) => ({
          ...record,
          checkInTime: new Date(record.checkInTime),
          event: {
            ...record.event,
            date: new Date(record.event.date),
          },
        })),
      };

      console.log('Transformed attendance data:', {
        recordsCount: transformedData.records.length,
        total: transformedData.total,
      });

      return transformedData;
    } catch (error: any) {
      console.error('Error fetching attendance records:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(error.message || 'Failed to fetch attendance records');
    }
  }
}

