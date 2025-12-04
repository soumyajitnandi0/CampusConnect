import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../../constants/theme';
import { hexToRgba } from '../../utils/colorUtils';

interface OrganizerHeaderCardProps {
  title: string;
  subtitle: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  rightAction?: {
    icon: React.ComponentProps<typeof FontAwesome>['name'];
    onPress: () => void;
  };
}

export const OrganizerHeaderCard: React.FC<OrganizerHeaderCardProps> = ({
  title,
  subtitle,
  icon = 'lock',
  rightAction,
}) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={Theme.blur.medium} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[
          hexToRgba(Theme.colors.background.tertiary, 0.8),
          hexToRgba(Theme.colors.background.secondary, 0.8),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.iconCircle}>
            <FontAwesome name={icon} size={Theme.typography.fontSize.xl} color={Theme.colors.accent.purpleLight} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>
        {rightAction && (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={styles.rightActionButton}
            activeOpacity={0.7}
          >
            <BlurView intensity={Theme.blur.light} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={[
                hexToRgba(Theme.colors.accent.purple, 0.3),
                hexToRgba(Theme.colors.accent.purple, 0.1),
              ]}
              style={StyleSheet.absoluteFill}
            />
            <FontAwesome name={rightAction.icon} size={Theme.typography.fontSize.lg} color={Theme.colors.accent.purpleLight} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: Theme.colors.glass.medium,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.md,
    marginHorizontal: Theme.layout.padding.horizontal,
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.layout.cardPadding.vertical,
    paddingHorizontal: Theme.layout.cardPadding.horizontal,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.glass.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.glass.borderLight,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs / 2,
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: '500',
    color: Theme.colors.text.secondary,
  },
  rightActionButton: {
    width: 48,
    height: 48,
    borderRadius: Theme.radius.full,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: hexToRgba(Theme.colors.accent.purple, 0.5),
    ...Theme.shadows.sm,
  },
});

