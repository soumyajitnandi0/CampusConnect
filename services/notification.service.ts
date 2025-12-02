import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationData } from '../types/models';
import { storage } from '../utils/storage';
import api from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static token: string | null = null;

  /**
   * Register device for push notifications
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      });

      this.token = tokenData.data;
      
      // Store token in backend
      await this.storePushToken(this.token);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return this.token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Store push token in backend
   */
  static async storePushToken(token: string): Promise<void> {
    try {
      const authToken = await storage.getItem('token');
      if (!authToken) {
        return; // User not logged in
      }

      await api.post(
        '/users/push-token',
        { pushToken: token },
        {
          headers: { 'x-auth-token': authToken },
        }
      );

      await storage.setItem('pushToken', token);
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  }

  /**
   * Send notification to event attendees
   */
  static async sendToEvent(eventId: string, notification: NotificationData): Promise<void> {
    try {
      const token = await storage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      await api.post(
        `/notifications/event/${eventId}`,
        notification,
        {
          headers: { 'x-auth-token': token },
        }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to send notification');
    }
  }

  /**
   * Send notification to specific user
   */
  static async sendToUser(userId: string, notification: NotificationData): Promise<void> {
    try {
      const token = await storage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      await api.post(
        `/notifications/user/${userId}`,
        notification,
        {
          headers: { 'x-auth-token': token },
        }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to send notification');
    }
  }

  /**
   * Setup notification listeners
   */
  static setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ): () => void {
    // Listener for notifications received while app is foregrounded
    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
      onNotificationReceived?.(notification);
    });

    // Listener for when user taps on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      onNotificationTapped?.(response);
    });

    // Return cleanup function
    return () => {
      Notifications.removeNotificationSubscription(receivedListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  /**
   * Get stored push token
   */
  static async getStoredToken(): Promise<string | null> {
    try {
      return await storage.getItem('pushToken');
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear push token
   */
  static async clearToken(): Promise<void> {
    try {
      await storage.removeItem('pushToken');
      this.token = null;
    } catch (error) {
      console.error('Error clearing push token:', error);
    }
  }
}

