import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNetwork } from '../contexts/network.context';

export function OfflineBanner() {
  const { isOffline, getNetworkErrorMessage } = useNetwork();

  if (!isOffline) {
    return null;
  }

  const errorMessage = getNetworkErrorMessage();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <FontAwesome name="exclamation-triangle" size={16} color="#FFFFFF" />
        <Text style={styles.text}>
          {errorMessage || 'No internet connection'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
});

