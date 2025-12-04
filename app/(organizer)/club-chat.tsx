import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const sendButtonScale = useRef(new Animated.Value(1)).current;

    const bottomPadding = Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : 80;

    useEffect(() => {
        if (clubId) {
            fetchClub();
            fetchMessages();
            const interval = setInterval(() => {
                fetchMessages(true);
            }, 3000);

            // Fade in animation
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

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

    const handleSendPressIn = () => {
        Animated.spring(sendButtonScale, {
            toValue: 0.9,
            useNativeDriver: true,
        }).start();
    };

    const handleSendPressOut = () => {
        Animated.spring(sendButtonScale, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    if (loading) {
        return (
            <ScreenWrapper style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.accent.purpleLight} />
            </ScreenWrapper>
        );
    }

    if (!club) {
        return (
            <ScreenWrapper style={styles.loadingContainer}>
                <Text style={styles.errorText}>Club not found</Text>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <PremiumHeader 
                title={club.name}
                subtitle={`${club.followerCount} members`}
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
                <Animated.View style={[styles.messagesWrapper, { opacity: fadeAnim }]}>
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
                                <ActivityIndicator size="small" color={Theme.colors.accent.purpleLight} />
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
                            <View style={styles.emptyStateContainer}>
                                <View style={styles.emptyStateIcon}>
                                    <BlurView intensity={Theme.blur.light} tint="dark" style={StyleSheet.absoluteFill} />
                                    <LinearGradient
                                        colors={[
                                            hexToRgba(Theme.colors.accent.purple, 0.2),
                                            hexToRgba(Theme.colors.accent.purple, 0.05),
                                        ]}
                                        style={StyleSheet.absoluteFill}
                                    />
                                    <FontAwesome name="comments-o" size={48} color={Theme.colors.text.disabled} />
                                </View>
                                <Text style={styles.emptyStateTitle}>No messages yet</Text>
                                <Text style={styles.emptyStateSubtitle}>Start the conversation!</Text>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>

                {/* Message Input Bar */}
                <View style={[styles.inputContainer, { paddingBottom: bottomPadding }]}>
                    <BlurView intensity={Theme.blur.medium} tint="dark" style={StyleSheet.absoluteFill} />
                    <LinearGradient
                        colors={[
                            hexToRgba(Theme.colors.background.primary, 0.95),
                            hexToRgba(Theme.colors.background.secondary, 0.95),
                        ]}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.inputBar}>
                        <View style={styles.inputWrapper}>
                            <BlurView intensity={Theme.blur.light} tint="dark" style={StyleSheet.absoluteFill} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Type a message..."
                                placeholderTextColor={Theme.colors.text.disabled}
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxLength={500}
                                textAlignVertical="center"
                            />
                        </View>
                        <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
                            <TouchableOpacity
                                onPress={handleSendMessage}
                                onPressIn={handleSendPressIn}
                                onPressOut={handleSendPressOut}
                                disabled={!message.trim() || sending}
                                style={[
                                    styles.sendButton,
                                    (!message.trim() || sending) && styles.sendButtonDisabled,
                                ]}
                                activeOpacity={0.8}
                            >
                                <BlurView intensity={Theme.blur.medium} tint="dark" style={StyleSheet.absoluteFill} />
                                <LinearGradient
                                    colors={
                                        (!message.trim() || sending)
                                            ? [Theme.colors.glass.medium, Theme.colors.glass.dark]
                                            : [
                                                  hexToRgba(Theme.colors.accent.purple, 0.4),
                                                  hexToRgba(Theme.colors.accent.purpleDark, 0.3),
                                              ]
                                    }
                                    style={StyleSheet.absoluteFill}
                                />
                                {sending ? (
                                    <ActivityIndicator size="small" color={Theme.colors.text.primary} />
                                ) : (
                                    <FontAwesome 
                                        name="paper-plane" 
                                        size={Theme.typography.fontSize.xl} 
                                        color={Theme.colors.text.primary} 
                                    />
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.text.secondary,
    },
    container: {
        flex: 1,
    },
    messagesWrapper: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: Theme.layout.padding.horizontal,
        paddingVertical: Theme.spacing.lg,
        paddingBottom: Theme.spacing.xxxl,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Theme.spacing.xxxl * 2,
    },
    emptyStateIcon: {
        width: 96,
        height: 96,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.spacing.xl,
        borderWidth: 1,
        borderColor: Theme.colors.glass.border,
    },
    emptyStateTitle: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '600',
        color: Theme.colors.text.secondary,
        marginBottom: Theme.spacing.sm,
    },
    emptyStateSubtitle: {
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.muted,
    },
    inputContainer: {
        borderTopWidth: 1,
        borderTopColor: Theme.colors.glass.border,
        paddingTop: Theme.spacing.lg,
        paddingHorizontal: Theme.layout.padding.horizontal,
        overflow: 'hidden',
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.md,
    },
    inputWrapper: {
        flex: 1,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Theme.colors.glass.borderLight,
        minHeight: 48,
        maxHeight: 100,
        paddingHorizontal: Theme.spacing.lg,
        justifyContent: 'center',
    },
    textInput: {
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.text.primary,
        fontWeight: '500',
        paddingVertical: Theme.spacing.md,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: hexToRgba(Theme.colors.accent.purple, 0.5),
        ...Theme.shadows.sm,
    },
    sendButtonDisabled: {
        borderColor: Theme.colors.glass.border,
        opacity: 0.5,
    },
});
