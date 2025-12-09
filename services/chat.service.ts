import { Message } from '../types/models';
import api from './api';

export class ChatService {
  /**
   * Send a message to a club chat
   */
  static async sendMessage(clubId: string, message: string): Promise<Message> {
    try {
      // API client automatically adds token via interceptor
      const response = await api.post(`/chat/club/${clubId}`, { message });
      // API client extracts data, so response is already the message object
      return this.transformMessage(response);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send message');
    }
  }

  /**
   * Get messages for a club
   */
  static async getMessages(clubId: string, limit: number = 50, before?: Date): Promise<Message[]> {
    try {
      const params: any = { limit };
      if (before) {
        params.before = before.toISOString();
      }
      // API client automatically adds token via interceptor
      const response = await api.get(`/chat/club/${clubId}`, { params });
      // API client extracts data, so response is already the array
      return Array.isArray(response)
        ? response.map((msg: any) => this.transformMessage(msg))
        : [];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch messages');
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    try {
      // API client automatically adds token via interceptor
      await api.delete(`/chat/${messageId}`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete message');
    }
  }

  /**
   * Transform API message to Message model
   */
  private static transformMessage(data: any): Message {
    return {
      id: data._id || data.id,
      club: data.club?._id || data.club || data.clubId,
      user: data.user?._id || data.user || data.userId,
      userName: data.user?.name,
      userEmail: data.user?.email,
      message: data.message,
      createdAt: new Date(data.createdAt || Date.now()),
    };
  }
}


