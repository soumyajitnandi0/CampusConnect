import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../../constants/theme';
import { Club } from '../../types/models';
import { getClubImageUrl } from '../../utils/cloudinary';
import { hexToRgba } from '../../utils/colorUtils';

interface OrganizerClubCardProps {
  club: Club;
  onPress: () => void;
}

export const OrganizerClubCard: React.FC<OrganizerClubCardProps> = ({ club, onPress }) => {
  const imageUrl = club.imageUrl
    ? (club.imageUrl.includes('cloudinary.com') || (!club.imageUrl.includes('http://') && !club.imageUrl.includes('https://')))
      ? getClubImageUrl(club.imageUrl, 200)
      : club.imageUrl
    : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.container}
    >
      <View style={styles.card}>
        <BlurView intensity={Theme.blur.medium} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[
            hexToRgba(Theme.colors.background.tertiary, 0.8),
            hexToRgba(Theme.colors.background.secondary, 0.8),
          ]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          {/* Club Image */}
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[
                  hexToRgba(Theme.colors.accent.purple, 0.3),
                  hexToRgba(Theme.colors.accent.purple, 0.1),
                ]}
                style={styles.imagePlaceholder}
              >
                <FontAwesome name="group" size={24} color={Theme.colors.accent.purpleLight} />
              </LinearGradient>
            )}
          </View>

          {/* Club Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.clubName} numberOfLines={1}>
              {club.name}
            </Text>
            <Text style={styles.clubDescription} numberOfLines={2}>
              {club.description}
            </Text>
            <View style={styles.metaRow}>
              <FontAwesome name="users" size={12} color={Theme.colors.text.muted} />
              <Text style={styles.metaText}>
                {club.followerCount} {club.followerCount === 1 ? 'follower' : 'followers'}
              </Text>
            </View>
          </View>

          {/* Arrow Icon */}
          <View style={styles.arrowContainer}>
            <BlurView intensity={Theme.blur.light} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={[Theme.colors.glass.medium, Theme.colors.glass.dark]}
              style={StyleSheet.absoluteFill}
            />
            <FontAwesome name="chevron-right" size={16} color={Theme.colors.text.secondary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Theme.layout.padding.horizontal,
    marginBottom: Theme.spacing.lg,
  },
  card: {
    borderRadius: Theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: Theme.colors.glass.medium,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.layout.cardPadding.vertical,
    paddingHorizontal: Theme.layout.cardPadding.horizontal,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: Theme.radius.md,
    overflow: 'hidden',
    marginRight: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.glass.borderLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  clubName: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  clubDescription: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.tertiary,
    marginBottom: Theme.spacing.sm,
    lineHeight: Theme.typography.fontSize.sm * Theme.typography.lineHeight.normal,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  metaText: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.text.muted,
    fontWeight: '500',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: Theme.radius.full,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.glass.borderLight,
  },
});

