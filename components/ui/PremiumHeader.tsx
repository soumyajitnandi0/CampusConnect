import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../../constants/theme';

interface PremiumHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightComponent?: React.ReactNode;
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  rightComponent,
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        {showBack && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
            <FontAwesome name="arrow-left" size={20} color={Theme.colors.text.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightComponent || <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 100,
    paddingTop: 50,
    paddingHorizontal: Theme.layout.padding.horizontal,
    paddingBottom: Theme.spacing.md,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.glass.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Theme.radius.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.glass.medium,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.sm,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: Theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.text.muted,
    fontWeight: '500',
    marginTop: Theme.spacing.xs / 2,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
});

