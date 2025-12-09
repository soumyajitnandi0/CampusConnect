import { RSVP } from '../types/models';
import api from './api';

export class RSVPService {
  /**
   * Add RSVP for an event
   */
  static async addRSVP(eventId: string, userId: string): Promise<RSVP> {
    try {
      // Debug: Check token before making request
      const { storage } = await import('../utils/storage');
      const token = await storage.getItem('token');
      if (token) {
        const parts = token.split('.');
        if (parts.length === 3) {
          try {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            console.log('[RSVP] Token type:', payload.user?.id ? 'JWT' : payload.email ? 'Supabase' : 'Unknown');
            console.log('[RSVP] Token has user.id:', !!payload.user?.id);
          } catch (e) {
            console.warn('[RSVP] Could not decode token payload');
          }
        } else {
          console.error('[RSVP] Invalid token format - not a JWT (should have 3 parts)');
        }
      } else {
        console.error('[RSVP] No token found in storage!');
      }

      // API client automatically adds token via interceptor
      const response = await api.post(
        `/events/${eventId}/rsvp`,
        { status: 'going' }
      );

      // API client extracts data, so response is already the RSVP object
      return this.transformRSVP(response);
    } catch (error: any) {
      console.error('[RSVP] Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        url: `/events/${eventId}/rsvp`
      });
      
      // If it's an authentication error, provide helpful message
      if (error.message?.includes('Token') || error.message?.includes('401') || error.statusCode === 401) {
        throw new Error('Authentication failed. Please log out and log back in to refresh your session.');
      }
      
      throw new Error(error.message || 'Failed to RSVP');
    }
  }

  /**
   * Remove RSVP for an event
   */
  static async removeRSVP(eventId: string, userId: string): Promise<void> {
    try {
      // API client automatically adds token via interceptor
      await api.delete(`/events/${eventId}/rsvp`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel RSVP');
    }
  }

  /**
   * Get user's RSVPs
   */
  static async getUserRSVPs(userId: string): Promise<RSVP[]> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.get(`/rsvps/user/${userId}`);
      // API client extracts data, so response is already the array
      return Array.isArray(response)
        ? response.map((rsvp: any) => this.transformRSVP(rsvp))
        : [];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch RSVPs');
    }
  }

  /**
   * Get event's RSVP list
   */
  static async getEventRSVPs(eventId: string): Promise<RSVP[]> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.get(`/rsvps/event/${eventId}`);
      // API client extracts data, so response is already the array
      return Array.isArray(response)
        ? response.map((rsvp: any) => this.transformRSVP(rsvp))
        : [];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch RSVPs');
    }
  }

  /**
   * Check if user has RSVP'd to an event
   */
  static async isUserRSVPd(eventId: string, userId: string): Promise<boolean> {
    try {
      const rsvps = await this.getEventRSVPs(eventId);
      return rsvps.some((rsvp) => rsvp.user === userId && rsvp.status === 'going');
    } catch (error) {
      return false;
    }
  }

  /**
   * Transform API RSVP to RSVP model
   */
  private static transformRSVP(data: any): RSVP {
    return {
      id: data._id || data.id,
      user: data.user?._id || data.user || data.userId,
      event: data.event?._id || data.event || data.eventId,
      status: data.status || 'going',
      attended: data.attended || false,
      createdAt: new Date(data.createdAt || Date.now()),
    };
  }
}

