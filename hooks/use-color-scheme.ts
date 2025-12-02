import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Hook to detect the current color scheme (light or dark).
 * This is a wrapper around React Native's useColorScheme.
 */
export function useColorScheme() {
    return useRNColorScheme();
}
