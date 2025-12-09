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
      // API client automatically adds token via interceptor
      const response = await api.get('/events');

      // API client extracts data, so response is already the array
      const events = Array.isArray(response) 
        ? response.map((event: any) => this.transformEvent(event))
        : [];
      
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
      // API client automatically adds token via interceptor
      const response = await api.get(`/events/${eventId}`);
      // API client extracts data, so response is already the event object
      return this.transformEvent(response);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch event');
    }
  }

  /**
   * Create a new event
   */
  static async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'rsvps' | 'checkedIn' | 'rsvpCount'>): Promise<string> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.post('/events', eventData);

      // Invalidate cache
      await this.clearCache();

      // API client extracts data, so response is already the event object
      return response._id || response.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create event');
    }
  }

  /**
   * Update an event
   */
  static async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    try {
      // API client automatically adds token via interceptor
      await api.put(`/events/${eventId}`, updates);

      // Invalidate cache
      await this.clearCache();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update event');
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      // API client automatically adds token via interceptor
      await api.delete(`/events/${eventId}`);

      // Invalidate cache
      await this.clearCache();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete event');
    }
  }

  /**
   * Get events created by a specific organizer (public)
   */
  static async getEventsByCreator(organizerId: string): Promise<Event[]> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.get(`/events/organizer/${organizerId}`);
      // API client extracts data, so response is already the array
      return Array.isArray(response)
        ? response.map((event: any) => this.transformEvent(event))
        : [];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch events');
    }
  }

  /**
   * Get events for the authenticated organizer (their own events)
   */
  static async getMyEvents(): Promise<Event[]> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.get('/events/my-events');
      // API client extracts data, so response is already the array
      return Array.isArray(response)
        ? response.map((event: any) => this.transformEvent(event))
        : [];
    } catch (error: any) {
      console.error('Error in getMyEvents:', error);
      throw new Error(error.message || 'Failed to fetch my events');
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
  static transformEvent(data: any): Event {
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
      duration: data.duration ? {
        days: data.duration.days || 0,
        hours: data.duration.hours || 0,
        minutes: data.duration.minutes || 0
      } : undefined,
      club: data.club?._id || data.club || undefined,
      clubName: data.club?.name,
      status: data.status || 'active',
      rescheduledDate: data.rescheduledDate ? new Date(data.rescheduledDate) : undefined,
      cancelReason: data.cancelReason,
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

