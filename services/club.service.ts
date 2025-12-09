import { Club } from '../types/models';
import api from './api';

export class ClubService {
  /**
   * Create a new club
   */
  static async createClub(data: {
    name: string;
    description: string;
    imageUrl?: string;
    category?: string;
  }): Promise<Club> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.post('/clubs', data);
      // API client extracts data, so response is already the club object
      return this.transformClub(response);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create club');
    }
  }

  /**
   * Get all clubs
   */
  static async getClubs(): Promise<Club[]> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.get('/clubs');
      // API client extracts data, so response is already the array
      return Array.isArray(response)
        ? response.map((club: any) => this.transformClub(club))
        : [];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch clubs');
    }
  }

  /**
   * Get club by ID
   */
  static async getClubById(id: string): Promise<Club> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.get(`/clubs/${id}`);
      // API client extracts data, so response is already the club object
      return this.transformClub(response);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch club');
    }
  }

  /**
   * Get clubs created by the authenticated organizer
   */
  static async getMyClubs(): Promise<Club[]> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.get('/clubs/organizer/my-clubs');
      // API client extracts data, so response is already the array
      return Array.isArray(response)
        ? response.map((club: any) => this.transformClub(club))
        : [];
    } catch (error: any) {
      console.error('Error in getMyClubs:', error);
      throw new Error(error.message || 'Failed to fetch my clubs');
    }
  }

  /**
   * Get clubs followed by the authenticated user
   */
  static async getFollowedClubs(): Promise<Club[]> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.get('/clubs/user/followed');
      // API client extracts data, so response is already the array
      return Array.isArray(response)
        ? response.map((club: any) => this.transformClub(club))
        : [];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch followed clubs');
    }
  }

  /**
   * Follow a club
   */
  static async followClub(clubId: string): Promise<void> {
    try {
      // API client automatically adds token via interceptor
      await api.post(`/clubs/${clubId}/follow`, {});
    } catch (error: any) {
      throw new Error(error.message || 'Failed to follow club');
    }
  }

  /**
   * Unfollow a club
   */
  static async unfollowClub(clubId: string): Promise<void> {
    try {
      // API client automatically adds token via interceptor
      await api.delete(`/clubs/${clubId}/follow`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to unfollow club');
    }
  }

  /**
   * Get events by club
   */
  static async getClubEvents(clubId: string): Promise<any[]> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.get(`/clubs/${clubId}/events`);
      // API client extracts data, so response is already the array
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch club events');
    }
  }

  /**
   * Update club
   */
  static async updateClub(clubId: string, data: {
    name?: string;
    description?: string;
    imageUrl?: string;
    category?: string;
  }): Promise<Club> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.put(`/clubs/${clubId}`, data);
      // API client extracts data, so response is already the club object
      return this.transformClub(response);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update club');
    }
  }

  /**
   * Delete club
   */
  static async deleteClub(clubId: string): Promise<void> {
    try {
      // API client automatically adds token via interceptor
      await api.delete(`/clubs/${clubId}`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete club');
    }
  }

  /**
   * Transform API club to Club model
   */
  private static transformClub(data: any): Club {
    let imageUrl = data.imageUrl;
    if (imageUrl && typeof imageUrl === 'string') {
      imageUrl = imageUrl.trim();
      if (imageUrl === '') {
        imageUrl = undefined;
      }
    } else if (!imageUrl) {
      imageUrl = undefined;
    }

    return {
      id: data._id || data.id,
      name: data.name,
      description: data.description,
      organizer: data.organizer?._id || data.organizer || data.organizerId,
      organizerName: data.organizer?.name,
      imageUrl: imageUrl,
      category: data.category,
      followers: data.followers?.map((f: any) => f._id || f.id || f) || [],
      followerCount: data.followerCount || data.followers?.length || 0,
      createdAt: new Date(data.createdAt || Date.now()),
      updatedAt: new Date(data.updatedAt || data.createdAt || Date.now()),
    };
  }
}


