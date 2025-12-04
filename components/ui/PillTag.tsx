import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/theme';
import { hexToRgba } from '../../utils/colorUtils';

interface PillTagProps {
  label: string;
  variant?: 'upcoming' | 'canceled' | 'rescheduled' | 'ended' | 'category' | 'custom';
  color?: string;
  glow?: boolean;
}

export const PillTag: React.FC<PillTagProps> = ({
  label,
  variant = 'custom',
  color,
  glow = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'upcoming':
        return {
          backgroundColor: hexToRgba(Theme.colors.accent.green, 0.2),
          borderColor: hexToRgba(Theme.colors.accent.green, 0.5),
          textColor: Theme.colors.accent.green,
          glowColor: Theme.colors.accent.green,
        };
      case 'canceled':
      case 'ended':
        return {
          backgroundColor: hexToRgba(Theme.colors.accent.red, 0.2),
          borderColor: hexToRgba(Theme.colors.accent.red, 0.5),
          textColor: Theme.colors.accent.red,
          glowColor: Theme.colors.accent.red,
        };
      case 'rescheduled':
        return {
          backgroundColor: hexToRgba(Theme.colors.accent.orange, 0.2),
          borderColor: hexToRgba(Theme.colors.accent.orange, 0.5),
          textColor: Theme.colors.accent.orange,
          glowColor: Theme.colors.accent.orange,
        };
      case 'category':
        return {
          backgroundColor: hexToRgba(Theme.colors.accent.purple, 0.2),
          borderColor: hexToRgba(Theme.colors.accent.purple, 0.5),
          textColor: Theme.colors.accent.purpleLight,
          glowColor: Theme.colors.accent.purple,
        };
      default:
        return {
          backgroundColor: color ? hexToRgba(color, 0.2) : Theme.colors.glass.medium,
          borderColor: color ? hexToRgba(color, 0.5) : Theme.colors.glass.border,
          textColor: color || Theme.colors.text.secondary,
          glowColor: color || Theme.colors.accent.purple,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <View style={[tagStyles.container, { borderColor: styles.borderColor }]}>
      {glow && (
        <View
          style={[
            tagStyles.glow,
            {
              backgroundColor: hexToRgba(styles.glowColor, 0.3),
              shadowColor: styles.glowColor,
            },
          ]}
        />
      )}
      <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[styles.backgroundColor, hexToRgba(styles.glowColor || Theme.colors.accent.purple, 0)]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Text style={[tagStyles.text, { color: styles.textColor }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const tagStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Theme.radius.full,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

