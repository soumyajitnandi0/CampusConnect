import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
import { hexToRgba } from '../../utils/colorUtils';

interface OrganizerFloatingButtonProps {
  onPress: () => void;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
}

export const OrganizerFloatingButton: React.FC<OrganizerFloatingButtonProps> = ({
  onPress,
  icon = 'plus',
}) => {
  const insets = useSafeAreaInsets();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, Theme.spacing.xl) + 60, // Above tab bar
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        style={styles.button}
      >
        <BlurView intensity={Theme.blur.medium} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[
            hexToRgba(Theme.colors.accent.purple, 0.4),
            hexToRgba(Theme.colors.accent.purpleDark, 0.4),
          ]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.innerShadow} />
        <FontAwesome name={icon} size={Theme.typography.fontSize.xl} color={Theme.colors.text.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Theme.layout.padding.horizontal,
    zIndex: 10,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: Theme.radius.full,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: hexToRgba(Theme.colors.accent.purple, 0.5),
    ...Theme.shadows.lg,
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: hexToRgba(Theme.colors.background.primary, 0.3),
  },
});

