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

      const response = await api.post('/attendance/verify', payload, {
        headers: { 'x-auth-token': token },
      });

      console.log('Check-in response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Check-in error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      const errorMessage = error.response?.data?.msg || error.message || 'Failed to check in';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get check-in status for a user and event
   */
  static async getCheckInStatus(eventId: string, userId: string): Promise<boolean> {
    try {
      const token = await storage.getItem('token');
      const response = await api.get(`/attendance/status/${eventId}/${userId}`, {
        headers: token ? { 'x-auth-token': token } : {},
      });
      return response.data.attended || false;
    } catch (error) {
      return false;
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
      const token = await storage.getItem('token');
      const response = await api.get(`/attendance/stats/${eventId}`, {
        headers: token ? { 'x-auth-token': token } : {},
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to fetch attendance');
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
}

