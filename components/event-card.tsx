import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Event } from '../types/models';
import { formatEventDate, getRelativeTime, isEventPast } from '../utils/event.utils';
import { GlassContainer } from './ui/GlassContainer';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  onRSVP?: () => void;
  isRSVPd?: boolean;
  showActions?: boolean;
}

export function EventCard({ event, onPress, onRSVP, isRSVPd, showActions = false }: EventCardProps) {
  const isPast = isEventPast(event);
  const canRSVP = !isPast;
  const imageUrl = event.imageUrl?.trim();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="mb-4"
    >
      <GlassContainer className="overflow-hidden p-0" intensity={20} contentClassName="p-0">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
          />
        ) : (
          <LinearGradient
            colors={['#1F2937', '#111827']}
            style={styles.image}
            className="items-center justify-center"
          >
            <FontAwesome name="image" size={32} color="#374151" />
          </LinearGradient>
        )}

        <View className="p-4">
          <View className="mb-2">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="text-xl font-bold text-white flex-1 mr-2" numberOfLines={2}>
                {event.title}
              </Text>
              <Text className="text-xs text-gray-400 font-medium mt-1">{getRelativeTime(event.date)}</Text>
            </View>
          </View>

          <Text className="text-sm text-gray-300 mb-3 leading-5" numberOfLines={2}>
            {event.description}
          </Text>

          <View className="mb-4 space-y-2">
            <View className="flex-row items-center">
              <FontAwesome name="calendar" size={14} color="#9CA3AF" />
              <Text className="text-sm text-gray-400 ml-2 flex-1">
                {formatEventDate(event.date)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <FontAwesome name="map-marker" size={14} color="#9CA3AF" />
              <Text className="text-sm text-gray-400 ml-2 flex-1" numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center pt-3 border-t border-white/10">
            <View className="flex-row items-center">
              <FontAwesome name="users" size={14} color="#9CA3AF" />
              <Text className="text-sm text-gray-400 ml-2">{event.rsvpCount || 0} RSVPs</Text>
            </View>

            {showActions && onRSVP && (
              <TouchableOpacity
                className={`px-4 py-2 rounded-full ${!canRSVP
                  ? 'bg-gray-700/50'
                  : isRSVPd
                    ? 'bg-red-500/20 border border-red-500/50'
                    : 'bg-white/10 border border-white/20'
                  }`}
                onPress={canRSVP ? onRSVP : undefined}
                disabled={!canRSVP}
              >
                <Text className={`text-xs font-bold ${!canRSVP
                  ? 'text-gray-400'
                  : isRSVPd
                    ? 'text-red-400'
                    : 'text-white'
                  }`}>
                  {!canRSVP ? 'Event Ended' : isRSVPd ? 'Cancel RSVP' : 'RSVP'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </GlassContainer>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 180,
  },
});
