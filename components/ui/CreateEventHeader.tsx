import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
import { hexToRgba } from '../../utils/colorUtils';

interface CreateEventHeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
}

export const CreateEventHeader: React.FC<CreateEventHeaderProps> = ({
  title,
  subtitle,
  icon = 'magic',
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <BlurView intensity={Theme.blur.medium} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[
          hexToRgba(Theme.colors.accent.blue, 0.2),
          hexToRgba(Theme.colors.accent.purple, 0.15),
          'transparent',
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

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <BlurView intensity={Theme.blur.light} tint="dark" style={StyleSheet.absoluteFill} />
          <FontAwesome name="times" size={Theme.typography.fontSize.lg} color={Theme.colors.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: hexToRgba(Theme.colors.background.primary, 0.8),
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.glass.border,
    ...Platform.select({
      ios: {
        shadowColor: Theme.shadows.sm.shadowColor,
        shadowOffset: Theme.shadows.sm.shadowOffset,
        shadowOpacity: Theme.shadows.sm.shadowOpacity,
        shadowRadius: Theme.shadows.sm.shadowRadius,
      },
      android: {
        elevation: Theme.shadows.sm.elevation,
      },
    }),
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.layout.padding.horizontal,
    paddingVertical: Theme.spacing.lg,
    minHeight: 80,
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.radius.full,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.glass.light,
    borderWidth: 1,
    borderColor: Theme.colors.glass.borderLight,
  },
});

