import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { EventService } from '../services/event.service';
import { RSVPService } from '../services/rsvp.service';
import { Event } from '../types/models';
import { useAuth } from './auth.context';

interface EventsContextType {
  events: Event[];
  myEvents: Event[];
  loading: boolean;
  error: string | null;
  isOfflineData: boolean;
  createEvent: (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'rsvps' | 'checkedIn' | 'rsvpCount'>) => Promise<string>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  rsvpForEvent: (eventId: string) => Promise<void>;
  cancelRSVP: (eventId: string) => Promise<void>;
  isUserRSVPd: (eventId: string) => boolean;
  refreshEvents: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);

  // Subscribe to real-time events updates
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    if (!user) {
      setEvents([]);
      setMyEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = EventService.subscribeToEvents(
      (updatedEvents) => {
        setEvents(updatedEvents);
        
        // Filter user's RSVP'd events
        const userRSVPs = updatedEvents.filter(event => 
          event.rsvps.includes(user.id)
        );
        setMyEvents(userRSVPs);
        
        setLoading(false);
        setError(null);
        setIsOfflineData(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        // Try to load cached data
        loadCachedEvents();
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  const loadCachedEvents = async () => {
    try {
      const cachedEvents = await EventService.getEvents();
      setEvents(cachedEvents);
      if (user) {
        const userRSVPs = cachedEvents.filter(event => 
          event.rsvps.includes(user.id)
        );
        setMyEvents(userRSVPs);
      }
      setIsOfflineData(true);
    } catch (err: any) {
      console.error('Error loading cached events:', err);
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'rsvps' | 'checkedIn' | 'rsvpCount'>): Promise<string> => {
    try {
      setError(null);
      const eventId = await EventService.createEvent(eventData);
      return eventId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<Event>): Promise<void> => {
    try {
      setError(null);
      await EventService.updateEvent(eventId, updates);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    try {
      setError(null);
      await EventService.deleteEvent(eventId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const rsvpForEvent = async (eventId: string): Promise<void> => {
    // Wait for auth to finish loading
    if (authLoading) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!user) {
      // Wait a bit more for auth to load, then check again
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!user) {
        throw new Error('Please log in to RSVP for events');
      }
    }
    
    try {
      setError(null);
      await RSVPService.addRSVP(eventId, user.id);
      // Refresh events to get updated RSVP count
      await refreshEvents();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const cancelRSVP = async (eventId: string): Promise<void> => {
    // Wait for auth to finish loading
    if (authLoading) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!user) {
      // Wait a bit more for auth to load, then check again
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!user) {
        throw new Error('Please log in to cancel RSVP');
      }
    }
    
    try {
      setError(null);
      await RSVPService.removeRSVP(eventId, user.id);
      // Refresh events to get updated RSVP count
      await refreshEvents();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const isUserRSVPd = (eventId: string): boolean => {
    if (!user) return false;
    const event = events.find(e => e.id === eventId);
    return event?.rsvps.includes(user.id) || false;
  };

  const refreshEvents = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedEvents = await EventService.getEvents();
      setEvents(updatedEvents);
      
      if (user) {
        const userRSVPs = updatedEvents.filter(event => 
          event.rsvps.includes(user.id)
        );
        setMyEvents(userRSVPs);
      }
      
      setIsOfflineData(false);
    } catch (err: any) {
      setError(err.message);
      setIsOfflineData(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <EventsContext.Provider
      value={{
        events,
        myEvents,
        loading,
        error,
        isOfflineData,
        createEvent,
        updateEvent,
        deleteEvent,
        rsvpForEvent,
        cancelRSVP,
        isUserRSVPd,
        refreshEvents,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}

