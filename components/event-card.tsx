import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/theme';
import { Event } from '../types/models';
import { getEventCardImageUrl } from '../utils/cloudinary';
import { hexToRgba } from '../utils/colorUtils';
import { formatEventDate, getRelativeTime, isEventPast } from '../utils/event.utils';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  onRSVP?: (e?: any) => void;
  isRSVPd?: boolean;
  isRSVPing?: boolean;
  showActions?: boolean;
}

export function EventCard({ event, onPress, onRSVP, isRSVPd, isRSVPing = false, showActions = false }: EventCardProps) {
  const isPast = isEventPast(event);
  const canRSVP = !isPast;
  
  // Get Cloudinary URL with 16:9 transformation, or fallback to original URL
  const imageUrl = event.imageUrl?.trim() 
    ? (event.imageUrl.includes('cloudinary.com') || (!event.imageUrl.includes('http://') && !event.imageUrl.includes('https://')))
      ? getEventCardImageUrl(event.imageUrl, 800)
      : event.imageUrl.trim()
    : null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.cardContainer}
    >
      <View style={styles.card}>
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        
        {/* Event Image with Gradient Overlay - Only show if image exists */}
        {imageUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
            />
            
            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', hexToRgba(Theme.colors.background.primary, 0.7)]}
              style={styles.imageOverlay}
            />
            
            {/* Category Tag */}
            {event.category && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{event.category.toUpperCase()}</Text>
              </View>
            )}
          </View>
        )}

        {/* Card Content */}
        <View style={styles.content}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={styles.relativeTime}>{getRelativeTime(event.date)}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>
            {event.description}
          </Text>

          {/* Event Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <FontAwesome name="calendar" size={14} color={Theme.colors.text.muted} />
              <Text style={styles.detailText}>
                {formatEventDate(event.date)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome name="map-marker" size={14} color={Theme.colors.text.muted} />
              <Text style={styles.detailText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.rsvpCount}>
              <FontAwesome name="users" size={14} color={Theme.colors.accent.blue} />
              <Text style={styles.rsvpCountText}>
                {event.rsvpCount || 0} attending
              </Text>
            </View>

            {showActions && onRSVP && (
              <TouchableOpacity
                style={[
                  styles.rsvpButton,
                  !canRSVP && styles.rsvpButtonDisabled,
                  isRSVPd && styles.rsvpButtonCancel,
                  isRSVPing && styles.rsvpButtonLoading
                ]}
                onPress={(e) => {
                  if (canRSVP && !isRSVPing) {
                    onRSVP(e);
                  }
                }}
                disabled={!canRSVP || isRSVPing}
                activeOpacity={0.7}
              >
                {isRSVPing ? (
                  <ActivityIndicator 
                    size="small" 
                    color={isRSVPd ? Theme.colors.accent.red : Theme.colors.text.primary} 
                  />
                ) : (
                  <Text style={[
                    styles.rsvpButtonText,
                    !canRSVP && styles.rsvpButtonTextDisabled,
                    isRSVPd && styles.rsvpButtonTextCancel
                  ]}>
                    {!canRSVP ? 'Event Ended' : isRSVPd ? 'Cancel RSVP' : 'RSVP'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: Theme.spacing.lg,
    marginHorizontal: Theme.layout.padding.horizontal,
  },
  card: {
    borderRadius: Theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: Theme.colors.glass.dark,
    borderWidth: 1,
    borderColor: Theme.colors.glass.borderLight,
    ...Theme.shadows.md,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  categoryTag: {
    position: 'absolute',
    top: Theme.spacing.md,
    right: Theme.spacing.md,
    backgroundColor: Theme.colors.accent.purple + '40',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.accent.purple + '60',
  },
  categoryText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: '700',
    color: Theme.colors.accent.purpleLight,
    letterSpacing: 0.5,
  },
  content: {
    padding: Theme.layout.cardPadding.vertical,
  },
  headerRow: {
    marginBottom: Theme.spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: Theme.colors.text.primary,
    marginRight: Theme.spacing.md,
    lineHeight: Theme.typography.fontSize['2xl'] * Theme.typography.lineHeight.tight,
  },
  relativeTime: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.text.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  description: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.tertiary,
    lineHeight: Theme.typography.fontSize.base * Theme.typography.lineHeight.normal,
    marginBottom: Theme.spacing.lg,
  },
  detailsContainer: {
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  detailText: {
    flex: 1,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.glass.borderLight,
  },
  rsvpCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  rsvpCountText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.accent.blue,
    fontWeight: '600',
  },
  rsvpButton: {
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.glass.medium,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
  },
  rsvpButtonDisabled: {
    backgroundColor: Theme.colors.glass.dark,
    borderColor: Theme.colors.glass.borderLight,
    opacity: 0.5,
  },
  rsvpButtonCancel: {
    backgroundColor: Theme.colors.accent.red + '20',
    borderColor: Theme.colors.accent.red + '50',
  },
  rsvpButtonText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  rsvpButtonTextDisabled: {
    color: Theme.colors.text.disabled,
  },
  rsvpButtonTextCancel: {
    color: Theme.colors.accent.red,
  },
  rsvpButtonLoading: {
    opacity: 0.7,
  },
});
