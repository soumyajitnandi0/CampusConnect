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

  // Helper to get normalized user ID (handles both id and _id)
  const getUserId = (userObj: any): string | null => {
    if (!userObj) return null;
    // Try id first, then _id, then convert to string
    const userId = userObj.id || userObj._id;
    return userId ? userId.toString() : null;
  };

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
        const userId = getUserId(user);
        if (!userId) {
          setMyEvents([]);
          setLoading(false);
          setError(null);
          setIsOfflineData(false);
          return;
        }
        const userRSVPs = updatedEvents.filter(event => 
          event.rsvps.some(rsvpId => rsvpId?.toString() === userId)
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
        const userId = getUserId(user);
        if (userId) {
          const userRSVPs = cachedEvents.filter(event => 
            event.rsvps.some(rsvpId => rsvpId?.toString() === userId)
          );
          setMyEvents(userRSVPs);
        }
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
    
    // Optimistic update - update UI immediately
    const userId = getUserId(user);
    if (!userId) {
      throw new Error('User ID not found. Please log in again.');
    }
    let updatedEvent: Event | null = null;
    setEvents(prevEvents => {
      const updated = prevEvents.map(event => {
        if (event.id === eventId) {
          const isAlreadyRSVPd = event.rsvps.some(rsvpId => 
            rsvpId?.toString() === userId
          );
          if (!isAlreadyRSVPd) {
            updatedEvent = {
              ...event,
              rsvps: [...event.rsvps, userId],
              rsvpCount: (event.rsvpCount || 0) + 1,
            };
            return updatedEvent;
          }
        }
        return event;
      });
      return updated;
    });
    
    // Update myEvents optimistically
    if (updatedEvent) {
      setMyEvents(prevMyEvents => {
        if (!prevMyEvents.find(e => e.id === eventId)) {
          return [...prevMyEvents, updatedEvent!];
        }
        return prevMyEvents;
      });
    }
    
    try {
      setError(null);
      // Use the same userId we computed for optimistic update
      await RSVPService.addRSVP(eventId, userId);
      // Refresh events to get updated data from server
      await refreshEventsSilently();
    } catch (err: any) {
      // Rollback optimistic update on error
      const userIdForRollback = getUserId(user);
      if (userIdForRollback) {
        setEvents(prevEvents => 
          prevEvents.map(event => {
            if (event.id === eventId) {
              return {
                ...event,
                rsvps: event.rsvps.filter(id => id?.toString() !== userIdForRollback),
                rsvpCount: Math.max(0, (event.rsvpCount || 0) - 1),
              };
            }
            return event;
          })
        );
      }
      setMyEvents(prevMyEvents => prevMyEvents.filter(e => e.id !== eventId));
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
    
    // Store the event before removing for rollback
    const eventToRemove = events.find(e => e.id === eventId);
    const userId = getUserId(user);
    if (!userId) {
      throw new Error('User ID not found. Please log in again.');
    }
    
    // Optimistic update - update UI immediately
    setEvents(prevEvents => 
      prevEvents.map(event => {
        if (event.id === eventId) {
          const isRSVPd = event.rsvps.some(rsvpId => 
            rsvpId?.toString() === userId
          );
          if (isRSVPd) {
            return {
              ...event,
              rsvps: event.rsvps.filter(id => id?.toString() !== userId),
              rsvpCount: Math.max(0, (event.rsvpCount || 0) - 1),
            };
          }
        }
        return event;
      })
    );
    
    // Update myEvents optimistically
    setMyEvents(prevMyEvents => prevMyEvents.filter(e => e.id !== eventId));
    
    try {
      setError(null);
      // Use the same userId we computed for optimistic update
      await RSVPService.removeRSVP(eventId, userId);
      // Refresh events to get updated data from server
      await refreshEventsSilently();
    } catch (err: any) {
      // Rollback optimistic update on error
      if (eventToRemove) {
        const userIdForRollback = getUserId(user);
        if (userIdForRollback) {
          setEvents(prevEvents => 
            prevEvents.map(event => {
              if (event.id === eventId) {
                const isCurrentlyRSVPd = event.rsvps.some(rsvpId => 
                  rsvpId?.toString() === userIdForRollback
                );
                if (!isCurrentlyRSVPd) {
                  return {
                    ...event,
                    rsvps: [...event.rsvps, userIdForRollback],
                    rsvpCount: (event.rsvpCount || 0) + 1,
                  };
                }
              }
              return event;
            })
          );
        }
        setMyEvents(prevMyEvents => {
          if (!prevMyEvents.find(e => e.id === eventId)) {
            return [...prevMyEvents, eventToRemove];
          }
          return prevMyEvents;
        });
      }
      setError(err.message);
      throw err;
    }
  };

  const isUserRSVPd = (eventId: string): boolean => {
    if (!user) return false;
    const event = events.find(e => e.id === eventId);
    if (!event) return false;
    
    // Handle both string and ObjectId comparisons
    const userId = getUserId(user);
    if (!userId) return false;
    
    return event.rsvps.some(rsvpId => 
      rsvpId?.toString() === userId
    );
  };

  const refreshEvents = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedEvents = await EventService.getEvents();
      setEvents(updatedEvents);
      
      if (user) {
        const userId = getUserId(user);
        if (userId) {
          const userRSVPs = updatedEvents.filter(event => 
            event.rsvps.some(rsvpId => rsvpId?.toString() === userId)
          );
          setMyEvents(userRSVPs);
        }
      }
      
      setIsOfflineData(false);
    } catch (err: any) {
      setError(err.message);
      setIsOfflineData(true);
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh that doesn't set loading state (for RSVP updates)
  const refreshEventsSilently = async (): Promise<void> => {
    try {
      setError(null);
      const updatedEvents = await EventService.getEvents();
      setEvents(updatedEvents);
      
      if (user) {
        const userId = getUserId(user);
        if (userId) {
          const userRSVPs = updatedEvents.filter(event => 
            event.rsvps.some(rsvpId => rsvpId?.toString() === userId)
          );
          setMyEvents(userRSVPs);
        }
      }
      
      setIsOfflineData(false);
    } catch (err: any) {
      setError(err.message);
      setIsOfflineData(true);
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

