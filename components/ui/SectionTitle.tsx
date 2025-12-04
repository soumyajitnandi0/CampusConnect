import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/theme';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  rightComponent,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightComponent && <View style={styles.right}>{rightComponent}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: Theme.typography.fontSize.xl,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.muted,
    fontWeight: '500',
  },
  right: {
    marginLeft: Theme.spacing.md,
  },
});

