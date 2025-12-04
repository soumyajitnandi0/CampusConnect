import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatBubble } from '../../components/ui/ChatBubble';
import { PremiumHeader } from '../../components/ui/PremiumHeader';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../contexts/auth.context';
import { ChatService } from '../../services/chat.service';
import { ClubService } from '../../services/club.service';
import { Club, Message } from '../../types/models';
import { hexToRgba } from '../../utils/colorUtils';

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
            const interval = setInterval(() => {
                fetchMessages(true);
            }, 3000);

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
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color={Theme.colors.text.primary} />
            </ScreenWrapper>
        );
    }

    if (!club) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <Text style={styles.errorText}>Club not found</Text>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <PremiumHeader 
                title={club.name}
                rightComponent={
                    <Text style={styles.memberCount}>{club.followerCount} members</Text>
                }
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Background Gradient */}
                <LinearGradient
                    colors={[Theme.colors.background.primary, Theme.colors.background.secondary]}
                    style={StyleSheet.absoluteFill}
                />

                {/* Messages List */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {loadingMessages && messages.length === 0 ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={Theme.colors.accent.purple} />
                        </View>
                    ) : messages.length > 0 ? (
                        messages.map((msg) => {
                            const isOwnMessage = user && msg.user === user.id;
                            return (
                                <ChatBubble
                                    key={msg.id}
                                    message={msg.message}
                                    userName={msg.userName}
                                    timestamp={msg.createdAt}
                                    isOwn={isOwnMessage || false}
                                />
                            );
                        })
                    ) : (
                        <View style={styles.emptyState}>
                            <FontAwesome name="comments-o" size={56} color={Theme.colors.text.disabled} />
                            <Text style={styles.emptyTitle}>No messages yet</Text>
                            <Text style={styles.emptySubtitle}>Start the conversation!</Text>
                        </View>
                    )}
                </ScrollView>

                {/* Message Input Bar */}
                <View style={[styles.inputContainer, { paddingBottom: bottomPadding }]}>
                    <View style={styles.inputBar}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={styles.inputContent}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type a message..."
                                placeholderTextColor={Theme.colors.text.disabled}
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxLength={500}
                                textAlignVertical="center"
                            />
                            <TouchableOpacity
                                onPress={handleSendMessage}
                                disabled={!message.trim() || sending}
                                style={[
                                    styles.sendButton,
                                    (!message.trim() || sending) && styles.sendButtonDisabled
                                ]}
                                activeOpacity={0.7}
                            >
                                <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                                <LinearGradient
                                    colors={[hexToRgba(Theme.colors.accent.purple, 0.4), hexToRgba(Theme.colors.accent.purple, 0.2)]}
                                    style={StyleSheet.absoluteFill}
                                />
                                {sending ? (
                                    <ActivityIndicator size="small" color={Theme.colors.accent.purpleLight} />
                                ) : (
                                    <FontAwesome name="paper-plane" size={20} color={Theme.colors.accent.purpleLight} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    memberCount: {
        fontSize: Theme.typography.fontSize.xs,
        color: Theme.colors.text.muted,
        fontWeight: '500',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: Theme.layout.padding.horizontal,
        paddingTop: Theme.spacing.lg,
        paddingBottom: 120,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xxl,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xxxl,
    },
    emptyTitle: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '600',
        color: Theme.colors.text.secondary,
        marginTop: Theme.spacing.lg,
    },
    emptySubtitle: {
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.muted,
        marginTop: Theme.spacing.xs,
        textAlign: 'center',
    },
    inputContainer: {
        paddingHorizontal: Theme.layout.padding.horizontal,
        paddingTop: Theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.glass.border,
        backgroundColor: hexToRgba(Theme.colors.background.primary, 0.8),
    },
    inputBar: {
        height: 56,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Theme.colors.glass.border,
        ...Theme.shadows.sm,
    },
    inputContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.md,
        gap: Theme.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.text.primary,
        fontWeight: '500',
        maxHeight: 100,
        paddingVertical: Theme.spacing.md,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: hexToRgba(Theme.colors.accent.purple, 0.5),
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    errorText: {
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.text.muted,
    },
});
