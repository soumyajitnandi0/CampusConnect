import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/theme';
import { hexToRgba } from '../../utils/colorUtils';

interface ChatBubbleProps {
  message: string;
  userName?: string;
  timestamp: Date | string;
  isOwn: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  userName,
  timestamp,
  isOwn,
}) => {
  const formatTime = (date: Date | string) => {
    const now = new Date();
    const messageDate = typeof date === 'string' ? new Date(date) : date;
    const diff = now.getTime() - messageDate.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View
        style={[
          styles.bubble,
          isOwn ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        <BlurView intensity={isOwn ? 20 : 15} tint="dark" style={StyleSheet.absoluteFill} />
        {isOwn ? (
          <LinearGradient
            colors={[hexToRgba(Theme.colors.accent.purple, 0.3), hexToRgba(Theme.colors.accent.purple, 0.1)]}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <LinearGradient
            colors={[Theme.colors.glass.medium, Theme.colors.glass.dark]}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.content}>
          {!isOwn && userName && (
            <Text style={styles.userName}>{userName}</Text>
          )}
          <Text style={[styles.message, isOwn ? styles.ownMessage : styles.otherMessage]}>
            {message}
          </Text>
          <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
            {formatTime(timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
    maxWidth: '75%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: Theme.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    ...Theme.shadows.sm,
  },
  ownBubble: {
    borderColor: hexToRgba(Theme.colors.accent.purple, 0.5),
  },
  otherBubble: {
    borderColor: Theme.colors.glass.border,
  },
  content: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  userName: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: '600',
    color: Theme.colors.accent.purpleLight,
    marginBottom: Theme.spacing.xs,
  },
  message: {
    fontSize: Theme.typography.fontSize.base,
    lineHeight: Theme.typography.fontSize.base * Theme.typography.lineHeight.normal,
  },
  ownMessage: {
    color: Theme.colors.text.primary,
    fontWeight: '500',
  },
  otherMessage: {
    color: Theme.colors.text.secondary,
    fontWeight: '400',
  },
  timestamp: {
    fontSize: Theme.typography.fontSize.xs,
    marginTop: Theme.spacing.xs,
  },
  ownTimestamp: {
    color: hexToRgba(Theme.colors.accent.purpleLight, 0.8),
  },
  otherTimestamp: {
    color: Theme.colors.text.muted,
  },
});

