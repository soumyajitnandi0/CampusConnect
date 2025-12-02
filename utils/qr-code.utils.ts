import { QRCodeData } from '../types/models';

/**
 * Encode user and event data to QR code string
 */
export function encodeQRData(userId: string, eventId: string): string {
  const data: QRCodeData = {
    userId,
    eventId,
    timestamp: Date.now(),
  };
  return JSON.stringify(data);
}

/**
 * Decode QR code string to QRCodeData
 */
export function decodeQRData(qrString: string): QRCodeData | null {
  try {
    const data = JSON.parse(qrString);
    
    // Validate structure
    if (
      typeof data === 'object' &&
      data !== null &&
      typeof data.userId === 'string' &&
      typeof data.eventId === 'string' &&
      typeof data.timestamp === 'number'
    ) {
      return data as QRCodeData;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate QR code data
 */
export function isValidQRData(data: any): data is QRCodeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.userId === 'string' &&
    typeof data.eventId === 'string' &&
    typeof data.timestamp === 'number'
  );
}

/**
 * Check if QR code is expired (older than 24 hours)
 */
export function isQRCodeExpired(qrData: QRCodeData, maxAgeHours: number = 24): boolean {
  const age = Date.now() - qrData.timestamp;
  const maxAge = maxAgeHours * 60 * 60 * 1000;
  return age > maxAge;
}

