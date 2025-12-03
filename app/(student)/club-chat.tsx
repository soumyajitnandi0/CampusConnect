import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useAuth } from '../../contexts/auth.context';
import { ChatService } from '../../services/chat.service';
import { ClubService } from '../../services/club.service';
import { Club, Message } from '../../types/models';

export default function ClubChatScreen() {
    const { clubId } = useLocalSearchParams<{ clubId: string }>();
    const [club, setClub] = useState<Club | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const bottomPadding = Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : 80;

    useEffect(() => {
        if (clubId) {
            fetchClub();
            fetchMessages();
            // Set up polling for new messages
            const interval = setInterval(() => {
                fetchMessages(true);
            }, 3000); // Poll every 3 seconds

            return () => clearInterval(interval);
        }
    }, [clubId]);

    const fetchClub = async () => {
        try {
            const clubData = await ClubService.getClubById(clubId);
            setClub(clubData);
        } catch (err: any) {
            Alert.alert('Error', 'Failed to load club');
        }
    };

    const fetchMessages = async (silent: boolean = false) => {
        try {
            if (!silent) setLoadingMessages(true);
            const fetchedMessages = await ChatService.getMessages(clubId);
            setMessages(fetchedMessages);
            // Scroll to bottom after loading
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
            }, 100);
        } catch (err: any) {
            if (!silent) {
                Alert.alert('Error', 'Failed to load messages');
            }
        } finally {
            if (!silent) {
                setLoadingMessages(false);
                setLoading(false);
            }
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !user) return;

        try {
            setSending(true);
            const newMessage = await ChatService.sendMessage(clubId, message);
            setMessages(prev => [...prev, newMessage]);
            setMessage('');
            // Scroll to bottom after sending
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const messageDate = new Date(date);
        const diff = now.getTime() - messageDate.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
        return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color="#FFFFFF" />
            </ScreenWrapper>
        );
    }

    if (!club) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <Text className="text-white">Club not found</Text>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Header */}
                <View className="px-6 pt-16 pb-4 flex-row items-center justify-between border-b border-white/10 bg-black/50">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full items-center justify-center bg-white/10 mr-3"
                        >
                            <FontAwesome name="arrow-left" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-lg" numberOfLines={1}>{club.name}</Text>
                            <Text className="text-gray-400 text-xs">{club.followerCount} members</Text>
                        </View>
                    </View>
                </View>

                {/* Messages List */}
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                    onContentSizeChange={() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                    }}
                >
                    {loadingMessages && messages.length === 0 ? (
                        <View className="items-center py-8">
                            <ActivityIndicator size="small" color="#A855F7" />
                        </View>
                    ) : messages.length > 0 ? (
                        messages.map((msg) => {
                            const isOwnMessage = user && msg.user === user.id;
                            return (
                                <View
                                    key={msg.id}
                                    className={`mb-3 ${isOwnMessage ? 'items-end' : 'items-start'}`}
                                >
                                    <View
                                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                                            isOwnMessage
                                                ? 'bg-blue-500/30 border border-blue-500/30'
                                                : 'bg-white/10 border border-white/10'
                                        }`}
                                    >
                                        {!isOwnMessage && (
                                            <Text className="text-purple-300 text-xs font-semibold mb-1">
                                                {msg.userName || 'Anonymous'}
                                            </Text>
                                        )}
                                        <Text className={`text-sm ${isOwnMessage ? 'text-white' : 'text-gray-200'}`}>
                                            {msg.message}
                                        </Text>
                                        <Text className={`text-[10px] mt-1 ${isOwnMessage ? 'text-blue-300' : 'text-gray-500'}`}>
                                            {formatTime(msg.createdAt)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View className="items-center py-12">
                            <FontAwesome name="comments-o" size={48} color="#4B5563" />
                            <Text className="text-gray-400 text-base mt-4 text-center">
                                No messages yet
                            </Text>
                            <Text className="text-gray-500 text-sm mt-2 text-center">
                                Start the conversation!
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {/* Message Input */}
                <View className="px-4 pt-4 border-t border-white/10 bg-black/50" style={{ paddingBottom: bottomPadding }}>
                    <View className="flex-row items-end">
                        <GlassContainer className="flex-1 mr-3" intensity={20}>
                            <TextInput
                                className="text-white text-base py-3 px-4"
                                placeholder="Type a message..."
                                placeholderTextColor="#6B7280"
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxLength={500}
                                style={{ maxHeight: 100 }}
                            />
                        </GlassContainer>
                        <TouchableOpacity
                            onPress={handleSendMessage}
                            disabled={!message.trim() || sending}
                            className="w-12 h-12 rounded-full bg-purple-500/30 border border-purple-500/30 items-center justify-center"
                            style={{ opacity: (!message.trim() || sending) ? 0.5 : 1 }}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#A855F7" />
                            ) : (
                                <FontAwesome name="paper-plane" size={18} color="#A855F7" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

