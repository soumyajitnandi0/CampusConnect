import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EventCard } from '../../components/event-card';
import { OrganizerFloatingButton } from '../../components/ui/OrganizerFloatingButton';
import { OrganizerHeaderCard } from '../../components/ui/OrganizerHeaderCard';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../contexts/auth.context';
import { EventService } from '../../services/event.service';

export default function OrganizerDashboard() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    const fetchEvents = async () => {
        try {
            if (!user || !user.id) {
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Fetch only events created by this organizer (using authenticated endpoint)
            const organizerEvents = await EventService.getMyEvents();
            setEvents(organizerEvents);
        } catch (err: any) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user && user.id) {
            fetchEvents();
        } else if (user === null) {
            // User is explicitly null (not loading), stop loading
            setLoading(false);
        }
        // If user is undefined, it's still loading, keep loading state
    }, [user]);

    // Refresh events when screen comes into focus (e.g., after creating an event)
    useFocusEffect(
        useCallback(() => {
            if (user && user.id) {
                fetchEvents();
            }
        }, [user])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchEvents();
    };

    const renderEvent = ({ item }: { item: any }) => (
        <View style={styles.eventCardContainer}>
            <EventCard
                event={item}
                onPress={() => router.push({ pathname: '/(organizer)/event-details', params: { id: item.id || item._id } })}
                showActions={false}
            />
        </View>
    );

    if (loading) {
        return (
            <ScreenWrapper style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.accent.purpleLight} />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <OrganizerHeaderCard
                title="Dashboard"
                subtitle="Manage your events"
                icon="lock"
            />

            <FlatList
                data={events}
                renderItem={renderEvent}
                keyExtractor={(item) => item.id || item._id || String(item)}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Theme.colors.accent.purpleLight}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="calendar-times-o" size={48} color={Theme.colors.text.disabled} />
                        <Text style={styles.emptyTitle}>
                            No events created yet
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            Tap the + button to create your first event!
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />

            <OrganizerFloatingButton
                onPress={() => router.push('/(organizer)/create-event')}
                icon="plus"
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 120,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: Theme.spacing.xxxl * 2,
        paddingHorizontal: Theme.layout.padding.horizontal,
    },
    emptyTitle: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '600',
        color: Theme.colors.text.secondary,
        marginTop: Theme.spacing.lg,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.muted,
        marginTop: Theme.spacing.sm,
        textAlign: 'center',
    },
    eventCardContainer: {
        paddingHorizontal: Theme.layout.padding.horizontal,
    },
});
