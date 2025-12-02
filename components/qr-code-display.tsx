import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { encodeQRData } from '../utils/qr-code.utils';

interface QRCodeDisplayProps {
  userId: string;
  eventId: string;
  size?: number;
  showLabel?: boolean;
}

export function QRCodeDisplay({ userId, eventId, size = 200, showLabel = true }: QRCodeDisplayProps) {
  const qrData = encodeQRData(userId, eventId);

  return (
    <View style={styles.container}>
      <View 
        style={[styles.qrContainer, { width: size + 40, height: size + 40 }]}
      >
        <QRCode
          value={qrData}
          size={size}
          color="#000000"
          backgroundColor="#FFFFFF"
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>Scan to check in</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    marginTop: 12,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

