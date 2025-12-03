import { Message } from '../types/models';
import { storage } from '../utils/storage';
import api from './api';

export class ChatService {
  /**
   * Send a message to a club chat
   */
  static async sendMessage(clubId: string, message: string): Promise<Message> {
    try {
      const token = await storage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await api.post(`/chat/club/${clubId}`, { message }, {
        headers: { 'x-auth-token': token },
      });
      return this.transformMessage(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to send message');
    }
  }

  /**
   * Get messages for a club
   */
  static async getMessages(clubId: string, limit: number = 50, before?: Date): Promise<Message[]> {
    try {
      const token = await storage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      const params: any = { limit };
      if (before) {
        params.before = before.toISOString();
      }
      const response = await api.get(`/chat/club/${clubId}`, {
        params,
        headers: { 'x-auth-token': token },
      });
      return response.data.map((msg: any) => this.transformMessage(msg));
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to fetch messages');
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    try {
      const token = await storage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      await api.delete(`/chat/${messageId}`, {
        headers: { 'x-auth-token': token },
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Failed to delete message');
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


