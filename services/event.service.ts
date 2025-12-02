import { Event } from '../types/models';
import { storage } from '../utils/storage';
import api from './api';

const CACHE_KEY = 'events_cache';
const CACHE_TIMESTAMP_KEY = 'events_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class EventService {
  private static listeners: Map<string, (events: Event[]) => void> = new Map();
  private static pollingInterval: NodeJS.Timeout | null = null;

  /**
   * Get all events from API
   */
  static async getEvents(): Promise<Event[]> {
    try {
      const token = await storage.getItem('token');
      const response = await api.get('/events', {
        headers: token ? { 'x-auth-token': token } : {},
      });

      const events = response.data.map((event: any) => this.transformEvent(event));
      
      // Cache the events
      await this.cacheEvents(events);
      
      return events;
    } catch (error: any) {
      // Try to return cached data if API fails
      const cached = await this.getCachedEvents();
      if (cached.length > 0) {
        return cached;
      }
      throw error;
    }
  }

  /**
   * Get a single event by ID
   */
  static async getEventById(eventId: string): Promise<Event> {
    try {
      const token = await storage.getItem('token');
      const response = await api.get(`/events/${eventId}`, {
        headers: token ? { 'x-auth-token': token } : {},
      });
      return this.transformEvent(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to fetch event');
    }
  }

  /**
   * Create a new event
   */
  static async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'rsvps' | 'checkedIn' | 'rsvpCount'>): Promise<string> {
    try {
      const token = await storage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await api.post('/events', eventData, {
        headers: { 'x-auth-token': token },
      });

      // Invalidate cache
      await this.clearCache();

      return response.data._id || response.data.id;
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to create event');
    }
  }

  /**
   * Update an event
   */
  static async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    try {
      const token = await storage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      await api.put(`/events/${eventId}`, updates, {
        headers: { 'x-auth-token': token },
      });

      // Invalidate cache
      await this.clearCache();
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to update event');
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      const token = await storage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      await api.delete(`/events/${eventId}`, {
        headers: { 'x-auth-token': token },
      });

      // Invalidate cache
      await this.clearCache();
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to delete event');
    }
  }

  /**
   * Get events created by a specific organizer
   */
  static async getEventsByCreator(organizerId: string): Promise<Event[]> {
    try {
      const token = await storage.getItem('token');
      const response = await api.get(`/events/organizer/${organizerId}`, {
        headers: token ? { 'x-auth-token': token } : {},
      });
      return response.data.map((event: any) => this.transformEvent(event));
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to fetch events');
    }
  }

  /**
   * Subscribe to real-time events updates (polling-based)
   */
  static subscribeToEvents(
    onUpdate: (events: Event[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const listenerId = Date.now().toString();
    
    // Initial fetch
    this.getEvents()
      .then(onUpdate)
      .catch((err) => {
        onError?.(err);
        // Try cached data
        this.getCachedEvents().then(onUpdate);
      });

    // Store listener
    this.listeners.set(listenerId, onUpdate);

    // Set up polling (every 30 seconds)
    if (!this.pollingInterval) {
      this.pollingInterval = setInterval(async () => {
        try {
          const events = await this.getEvents();
          this.listeners.forEach((callback) => callback(events));
        } catch (error) {
          // Silently fail, use cached data
          const cached = await this.getCachedEvents();
          this.listeners.forEach((callback) => callback(cached));
        }
      }, 30000);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listenerId);
      if (this.listeners.size === 0 && this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    };
  }

  /**
   * Transform API event to Event model
   */
  private static transformEvent(data: any): Event {
    // Clean imageUrl - remove empty strings and whitespace
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
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      location: data.location,
      organizer: data.organizer?._id || data.organizer || data.organizerId,
      organizerName: data.organizer?.name,
      rsvps: data.rsvps || [],
      checkedIn: data.checkedIn || [],
      rsvpCount: data.rsvpCount || 0,
      category: data.category,
      imageUrl: imageUrl,
      qrCodeToken: data.qrCodeToken,
      createdAt: new Date(data.createdAt || Date.now()),
      updatedAt: new Date(data.updatedAt || Date.now()),
    };
  }

  /**
   * Cache events locally
   */
  private static async cacheEvents(events: Event[]): Promise<void> {
    try {
      await storage.setItem(CACHE_KEY, JSON.stringify(events));
      await storage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to cache events:', error);
    }
  }

  /**
   * Get cached events
   */
  private static async getCachedEvents(): Promise<Event[]> {
    try {
      const cached = await storage.getItem(CACHE_KEY);
      const timestamp = await storage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (!cached || !timestamp) {
        return [];
      }

      const age = Date.now() - parseInt(timestamp, 10);
      if (age > CACHE_DURATION) {
        return [];
      }

      return JSON.parse(cached);
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear event cache
   */
  private static async clearCache(): Promise<void> {
    try {
      await storage.removeItem(CACHE_KEY);
      await storage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

