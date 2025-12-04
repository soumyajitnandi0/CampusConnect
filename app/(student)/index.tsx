import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EventCard } from '../../components/event-card';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../contexts/auth.context';
import { useEvents } from '../../contexts/events.context';
import { Event } from '../../types/models';
import { isEventPast } from '../../utils/event.utils';

export default function HomeScreen() {
    const router = useRouter();
    const { events, loading, rsvpForEvent, cancelRSVP, isUserRSVPd, refreshEvents, isOfflineData } = useEvents();
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [rsvpingEvents, setRsvpingEvents] = useState<Set<string>>(new Set());
    const [showPastEvents, setShowPastEvents] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshEvents();
        setRefreshing(false);
    };

    const handleRSVP = async (eventId: string, e?: any) => {
        // Stop event propagation to prevent card press
        if (e) {
            e.stopPropagation();
        }

        // Prevent multiple simultaneous RSVP actions on same event
        if (rsvpingEvents.has(eventId)) {
            return;
        }

        try {
            setRsvpingEvents(prev => new Set(prev).add(eventId));
            
            if (isUserRSVPd(eventId)) {
                await cancelRSVP(eventId);
            } else {
                await rsvpForEvent(eventId);
            }
        } catch (error: any) {
            // Better error handling - could be replaced with toast notification
            console.error('RSVP error:', error);
            // Show error but don't use alert in production
            if (__DEV__) {
                alert(error.message || 'RSVP action failed');
            }
        } finally {
            setRsvpingEvents(prev => {
                const newSet = new Set(prev);
                newSet.delete(eventId);
                return newSet;
            });
        }
    };

    const handleEventPress = (event: Event) => {
        router.push({
            pathname: '/event/[id]',
            params: { id: event.id },
        });
    };

    // Filter events by search query and past events toggle
    const filteredEvents = events.filter(event => {
        // Filter by past events toggle
        const isPast = isEventPast(event);
        if (showPastEvents && !isPast) return false;
        if (!showPastEvents && isPast) return false;

        // Filter by search query
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            event.title.toLowerCase().includes(query) ||
            event.description.toLowerCase().includes(query) ||
            event.location.toLowerCase().includes(query)
        );
    });

    const renderHeader = () => {
        return (
            <View style={styles.header}>
                {/* Top Row: Greeting & Icons */}
                <View style={styles.headerTop}>
                    <View style={styles.greetingContainer}>
                        <Text style={styles.greetingText}>Welcome back,</Text>
                        <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Student'}</Text>
                    </View>

                    <View style={styles.iconContainer}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            activeOpacity={0.7}
                        >
                            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                            <View style={styles.iconButtonInner}>
                                <FontAwesome name="bell-o" size={18} color={Theme.colors.text.primary} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => router.push('/(student)/profile')}
                            activeOpacity={0.7}
                        >
                            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                            <View style={styles.iconButtonInner}>
                                <Text style={styles.profileInitial}>
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar & Past Events Button */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={styles.searchContent}>
                            <FontAwesome 
                                name="search" 
                                size={18} 
                                color={Theme.colors.text.muted} 
                                style={styles.searchIcon}
                            />
                            <Text
                                style={styles.searchInput}
                                onPress={() => {
                                    // You can add search modal or navigation here
                                }}
                            >
                                Search events...
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowPastEvents(!showPastEvents)}
                        style={[styles.pastEventsButton, showPastEvents && styles.pastEventsButtonActive]}
                        activeOpacity={0.7}
                    >
                        <BlurView intensity={showPastEvents ? 20 : 15} tint="dark" style={StyleSheet.absoluteFill} />
                        <FontAwesome 
                            name={showPastEvents ? "rss" : "history"} 
                            size={16} 
                            color={showPastEvents ? Theme.colors.text.primary : Theme.colors.text.muted} 
                            style={{ marginRight: Theme.spacing.xs }}
                        />
                        <Text style={[styles.pastEventsText, showPastEvents && styles.pastEventsTextActive]}>
                            {showPastEvents ? "Feed" : "Past"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading && events.length === 0) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color={Theme.colors.text.primary} />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <FlatList
                data={filteredEvents}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <EventCard
                        event={item}
                        onPress={() => handleEventPress(item)}
                        onRSVP={(e) => handleRSVP(item.id, e)}
                        isRSVPd={isUserRSVPd(item.id)}
                        isRSVPing={rsvpingEvents.has(item.id)}
                        showActions={true}
                    />
                )}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Theme.colors.text.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="calendar-times-o" size={56} color={Theme.colors.text.disabled} />
                        <Text style={styles.emptyTitle}>
                            {searchQuery ? 'No events match your search' : 'No events found'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {searchQuery ? 'Try a different search term' : 'Check back later for exciting events!'}
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: Theme.layout.padding.horizontal,
        paddingTop: Theme.spacing.xxl,
        paddingBottom: Theme.spacing.lg,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.spacing.xl,
    },
    greetingContainer: {
        flex: 1,
    },
    greetingText: {
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.muted,
        fontWeight: '500',
        marginBottom: Theme.spacing.xs,
    },
    userName: {
        fontSize: Theme.typography.fontSize['3xl'],
        fontWeight: '700',
        color: Theme.colors.text.primary,
        letterSpacing: -0.5,
    },
    iconContainer: {
        flexDirection: 'row',
        gap: Theme.spacing.md,
        alignItems: 'center',
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        backgroundColor: Theme.colors.glass.medium,
        borderWidth: 1,
        borderColor: Theme.colors.glass.borderLight,
        ...Theme.shadows.sm,
    },
    iconButtonInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInitial: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '700',
        color: Theme.colors.text.primary,
    },
    searchContainer: {
        marginTop: Theme.spacing.md,
        flexDirection: 'row',
        gap: Theme.spacing.md,
        alignItems: 'center',
    },
    searchBar: {
        flex: 1,
        height: 52,
        borderRadius: Theme.radius.md,
        overflow: 'hidden',
        backgroundColor: Theme.colors.glass.medium,
        borderWidth: 1,
        borderColor: Theme.colors.glass.borderLight,
        ...Theme.shadows.sm,
    },
    pastEventsButton: {
        height: 52,
        paddingHorizontal: Theme.spacing.lg,
        borderRadius: Theme.radius.md,
        overflow: 'hidden',
        backgroundColor: Theme.colors.glass.medium,
        borderWidth: 1,
        borderColor: Theme.colors.glass.borderLight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...Theme.shadows.sm,
    },
    pastEventsButtonActive: {
        borderColor: Theme.colors.accent.purple + '60',
        backgroundColor: Theme.colors.accent.purple + '20',
    },
    pastEventsText: {
        fontSize: Theme.typography.fontSize.sm,
        fontWeight: '600',
        color: Theme.colors.text.muted,
    },
    pastEventsTextActive: {
        color: Theme.colors.text.primary,
    },
    searchContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
    },
    searchIcon: {
        marginRight: Theme.spacing.md,
    },
    searchInput: {
        flex: 1,
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.text.secondary,
        fontWeight: '500',
    },
    listContent: {
        paddingBottom: 120,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: Theme.layout.padding.horizontal,
    },
    emptyTitle: {
        marginTop: Theme.spacing.xl,
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '600',
        color: Theme.colors.text.secondary,
        textAlign: 'center',
    },
    emptySubtitle: {
        marginTop: Theme.spacing.sm,
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.muted,
        textAlign: 'center',
    },
});
