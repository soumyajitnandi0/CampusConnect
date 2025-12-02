import { Event } from '../types/models';

/**
 * Check if event date has passed
 */
export function isEventPast(event: Event): boolean {
  return new Date(event.date) < new Date();
}

/**
 * Check if event is upcoming
 */
export function isEventUpcoming(event: Event): boolean {
  return new Date(event.date) >= new Date();
}

/**
 * Sort events by date (upcoming first)
 */
export function sortEventsByDate(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });
}

/**
 * Filter events by status
 */
export function filterEventsByStatus(events: Event[], status: 'upcoming' | 'past' | 'all'): Event[] {
  if (status === 'all') return events;
  
  if (status === 'upcoming') {
    return events.filter(isEventUpcoming);
  }
  
  return events.filter(isEventPast);
}

/**
 * Get attendance summary string
 */
export function getAttendanceSummary(rsvpCount: number, checkedIn: number): string {
  if (rsvpCount === 0) return 'No RSVPs yet';
  if (checkedIn === 0) return `${rsvpCount} RSVPs, 0 checked in`;
  
  const rate = Math.round((checkedIn / rsvpCount) * 100);
  return `${checkedIn}/${rsvpCount} checked in (${rate}%)`;
}

/**
 * Format event date for display
 */
export function formatEventDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get relative time string (e.g., "in 2 days", "3 days ago")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
  const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
  const minutes = Math.floor(Math.abs(diff) / (1000 * 60));

  if (diff < 0) {
    // Past
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    // Future
    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}

