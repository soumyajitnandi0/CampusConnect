import { RSVP } from '../types/models';
import { storage } from '../utils/storage';
import api from './api';

export class RSVPService {
  /**
   * Add RSVP for an event
   */
  static async addRSVP(eventId: string, userId: string): Promise<RSVP> {
    try {
      const token = await storage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await api.post(
        `/events/${eventId}/rsvp`,
        { status: 'going' },
        {
          headers: { 'x-auth-token': token },
        }
      );

      return this.transformRSVP(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to RSVP');
    }
  }

  /**
   * Remove RSVP for an event
   */
  static async removeRSVP(eventId: string, userId: string): Promise<void> {
    try {
      const token = await storage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      await api.delete(`/events/${eventId}/rsvp`, {
        headers: { 'x-auth-token': token },
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to cancel RSVP');
    }
  }

  /**
   * Get user's RSVPs
   */
  static async getUserRSVPs(userId: string): Promise<RSVP[]> {
    try {
      const token = await storage.getItem('token');
      const response = await api.get(`/rsvps/user/${userId}`, {
        headers: token ? { 'x-auth-token': token } : {},
      });
      return response.data.map((rsvp: any) => this.transformRSVP(rsvp));
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to fetch RSVPs');
    }
  }

  /**
   * Get event's RSVP list
   */
  static async getEventRSVPs(eventId: string): Promise<RSVP[]> {
    try {
      const token = await storage.getItem('token');
      const response = await api.get(`/rsvps/event/${eventId}`, {
        headers: token ? { 'x-auth-token': token } : {},
      });
      return response.data.map((rsvp: any) => this.transformRSVP(rsvp));
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to fetch RSVPs');
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

