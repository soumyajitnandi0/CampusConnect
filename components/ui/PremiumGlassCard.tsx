import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Theme } from '../../constants/theme';

interface PremiumGlassCardProps extends ViewProps {
  intensity?: number;
  gradient?: boolean;
  gradientColors?: string[];
  children: React.ReactNode;
}

export const PremiumGlassCard: React.FC<PremiumGlassCardProps> = ({
  intensity = 20,
  gradient = false,
  gradientColors,
  children,
  style,
  ...props
}) => {
  return (
    <View
      style={[
        styles.card,
        style,
      ]}
      {...props}
    >
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      {gradient && (
        <LinearGradient
          colors={gradientColors || ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: Theme.colors.glass.medium,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.md,
  },
  content: {
    padding: Theme.layout.cardPadding.vertical,
  },
});

