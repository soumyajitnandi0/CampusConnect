import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import api from './api';

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
    const token = await storage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

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

    // Upload to backend with type parameter
    const uploadResponse = await fetch(`${api.defaults.baseURL}/upload/image?type=${type}`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
        // Don't set Content-Type, let fetch set it with boundary for FormData
      },
      body: formData as any,
    });

    if (!uploadResponse.ok) {
      // Try to parse as JSON, but handle HTML/plain text errors
      let errorMessage = 'Failed to upload image';
      try {
        const contentType = uploadResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await uploadResponse.json();
          errorMessage = error.msg || error.message || errorMessage;
        } else {
          // If not JSON, read as text
          const text = await uploadResponse.text();
          console.error('Upload error response (non-JSON):', text);
          errorMessage = `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`;
        }
      } catch (parseError) {
        console.error('Error parsing upload response:', parseError);
        errorMessage = `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Parse successful response
    const contentType = uploadResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await uploadResponse.json();
    } else {
      // If response is not JSON, something went wrong
      const text = await uploadResponse.text();
      console.error('Unexpected upload response format:', text);
      throw new Error('Invalid response from server');
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
}

