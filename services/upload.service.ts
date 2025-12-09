import { Platform } from 'react-native';
import apiClient from '../src/infrastructure/api/client';

export interface UploadResponse {
  publicId: string;
  url: string;
  width: number;
  height: number;
}

/**
 * Upload image to Cloudinary via backend
 * @param imageUri - Local image URI (from expo-image-picker)
 * @param type - Type of upload: 'events' or 'clubs' (default: 'events')
 * @returns Upload response with publicId and URL
 */
export async function uploadImage(imageUri: string, type: 'events' | 'clubs' = 'events'): Promise<UploadResponse> {
  try {
    // Create FormData for React Native
    const formData = new FormData();
    
    // Determine file extension and mime type from URI
    const uriParts = imageUri.split('.');
    const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
    let mimeType = 'image/jpeg';
    if (fileExtension === 'png') {
      mimeType = 'image/png';
    } else if (fileExtension === 'gif') {
      mimeType = 'image/gif';
    } else if (fileExtension === 'webp') {
      mimeType = 'image/webp';
    }

    // For React Native, FormData expects an object with uri, type, and name
    // iOS needs file:// prefix removed, Android keeps it
    const fileUri = Platform.OS === 'ios' 
      ? imageUri.replace('file://', '') 
      : imageUri;

    // Append image file - React Native FormData format
    formData.append('image', {
      uri: fileUri,
      type: mimeType,
      name: `event-image.${fileExtension}`,
    } as any);

    // Use API client's upload method which handles authentication via interceptor
    const response = await apiClient.upload<UploadResponse>(
      `/upload/image?type=${type}`,
      formData
    );

    return response;
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
}

