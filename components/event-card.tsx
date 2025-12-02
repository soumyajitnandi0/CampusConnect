import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Event } from '../types/models';
import { formatEventDate, getRelativeTime, isEventPast } from '../utils/event.utils';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  onRSVP?: () => void;
  isRSVPd?: boolean;
  showActions?: boolean;
}

export function EventCard({ event, onPress, onRSVP, isRSVPd = false, showActions = true }: EventCardProps) {
  const isPast = isEventPast(event);
  const canRSVP = !isPast; // Can only RSVP to future events
  
  // Clean and validate imageUrl
  const imageUrl = event.imageUrl && typeof event.imageUrl === 'string' && event.imageUrl.trim() !== '' 
    ? event.imageUrl.trim() 
    : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
          onError={(error) => {
            console.error('Image load error for event:', event.id);
            console.error('Image URL:', imageUrl);
            console.error('Error details:', error);
          }}
          onLoad={() => {
            console.log('Image loaded successfully for event:', event.id, 'URL:', imageUrl);
          }}
        />
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            <Text style={styles.time}>{getRelativeTime(event.date)}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <FontAwesome name="calendar" size={14} color="#6B7280" />
            <Text style={styles.metaText}>
              {formatEventDate(event.date)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome name="map-marker" size={14} color="#6B7280" />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <FontAwesome name="users" size={14} color="#6B7280" />
              <Text style={styles.statText}>{event.rsvpCount || 0} RSVPs</Text>
            </View>
          </View>

          {showActions && onRSVP && (
            <TouchableOpacity
              style={[
                styles.rsvpButton, 
                isRSVPd && styles.rsvpButtonActive,
                !canRSVP && styles.rsvpButtonDisabled
              ]}
              onPress={canRSVP ? onRSVP : undefined}
              disabled={!canRSVP}
            >
              <Text style={[
                styles.rsvpText, 
                isRSVPd && styles.rsvpTextActive,
                !canRSVP && styles.rsvpTextDisabled
              ]}>
                {!canRSVP ? 'Event Ended' : isRSVPd ? 'Cancel RSVP' : 'RSVP'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 8,
  },
  titleContainer: {
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  meta: {
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  rsvpButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  rsvpButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  rsvpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  rsvpTextActive: {
    color: '#9333EA',
  },
  rsvpButtonDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  rsvpTextDisabled: {
    color: '#9CA3AF',
  },
});

