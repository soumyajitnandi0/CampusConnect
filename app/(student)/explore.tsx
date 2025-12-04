import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EventCard } from '../../components/event-card';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Theme } from '../../constants/theme';
import { useEvents } from '../../contexts/events.context';
import { Event } from '../../types/models';

export default function ExploreScreen() {
    const router = useRouter();
    const { events, loading, refreshEvents } = useEvents();
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshEvents();
        setRefreshing(false);
    };

    const handleEventPress = (event: Event) => {
        router.push({
            pathname: '/event/[id]',
            params: { id: event.id },
        });
    };

    const getCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const startingDayOfWeek = firstDayOfMonth.getDay();

        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - startingDayOfWeek);

        const days: Date[] = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            days.push(date);
        }

        return days;
    };

    const calendarDays = useMemo(() => getCalendarDays(), [currentMonth]);

    const filteredEvents = useMemo(() => {
        let filtered = events;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(query) ||
                event.description.toLowerCase().includes(query) ||
                event.location.toLowerCase().includes(query)
            );
        }

        filtered = filtered.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            const selected = new Date(selectedDate);
            selected.setHours(0, 0, 0, 0);
            return eventDate.getTime() === selected.getTime();
        });

        return filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateA - dateB;
        });
    }, [events, searchQuery, selectedDate]);

    const eventsByDate = useMemo(() => {
        const grouped: { [key: string]: Event[] } = {};
        events.forEach(event => {
            const eventDate = new Date(event.date);
            const dateKey = eventDate.toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(event);
        });
        return grouped;
    }, [events]);

    const getEventsCountForDate = (date: Date) => {
        const dateKey = date.toDateString();
        return eventsByDate[dateKey]?.length || 0;
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSameMonth = (date: Date) => {
        return date.getMonth() === currentMonth.getMonth();
    };

    const isSelected = (date: Date) => {
        return date.toDateString() === selectedDate.toDateString();
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
        setCurrentMonth(newDate);
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
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Theme.colors.text.primary}
                    />
                }
            >
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Explore Events</Text>
                    </View>

                    {/* Glassy Calendar Container */}
                    <View style={styles.calendarContainer}>
                        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                        
                        {/* Month Navigation */}
                        <View style={styles.monthNavigation}>
                            <TouchableOpacity 
                                onPress={() => navigateMonth('prev')} 
                                style={styles.navButton}
                                activeOpacity={0.7}
                            >
                                <FontAwesome name="chevron-left" size={16} color={Theme.colors.text.primary} />
                            </TouchableOpacity>
                            <Text style={styles.monthText}>
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => navigateMonth('next')} 
                                style={styles.navButton}
                                activeOpacity={0.7}
                            >
                                <FontAwesome name="chevron-right" size={16} color={Theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Weekday Headers */}
                        <View style={styles.weekdayContainer}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                <Text key={index} style={styles.weekdayText}>
                                    {day}
                                </Text>
                            ))}
                        </View>

                        {/* Calendar Grid */}
                        <View style={styles.calendarGrid}>
                            {calendarDays.map((date, index) => {
                                const eventCount = getEventsCountForDate(date);
                                const isCurrentMonth = isSameMonth(date);
                                const selected = isSelected(date);
                                const today = isToday(date);

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => {
                                            setSelectedDate(date);
                                            if (!isCurrentMonth) {
                                                setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                                            }
                                        }}
                                        style={styles.dayContainer}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[
                                            styles.dayCircle,
                                            selected && styles.dayCircleSelected,
                                            today && !selected && styles.dayCircleToday
                                        ]}>
                                            <Text style={[
                                                styles.dayText,
                                                selected && styles.dayTextSelected,
                                                !isCurrentMonth && styles.dayTextOtherMonth
                                            ]}>
                                                {date.getDate()}
                                            </Text>
                                        </View>

                                        {/* Event Indicators */}
                                        {eventCount > 0 && (
                                            <View style={styles.eventIndicators}>
                                                {eventCount > 0 && (
                                                    <View style={[
                                                        styles.eventDot,
                                                        { backgroundColor: Theme.colors.accent.blue }
                                                    ]} />
                                                )}
                                                {eventCount > 1 && (
                                                    <View style={[
                                                        styles.eventDot,
                                                        { backgroundColor: Theme.colors.accent.purple }
                                                    ]} />
                                                )}
                                                {eventCount > 2 && (
                                                    <View style={[
                                                        styles.eventDot,
                                                        { backgroundColor: Theme.colors.accent.green }
                                                    ]} />
                                                )}
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Selected Date Header */}
                    <View style={styles.dateHeader}>
                        <Text style={styles.dateTitle}>
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                        <Text style={styles.dateSubtitle}>
                            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} scheduled
                        </Text>
                    </View>

                    {/* Events List */}
                    {filteredEvents.length > 0 ? (
                        <View style={styles.eventsList}>
                            {filteredEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onPress={() => handleEventPress(event)}
                                    showActions={false}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <FontAwesome name="calendar-o" size={56} color={Theme.colors.text.disabled} />
                            <Text style={styles.emptyTitle}>No events on this date</Text>
                            <Text style={styles.emptySubtitle}>
                                Try selecting a date with dots to see scheduled events.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 120,
    },
    content: {
        paddingHorizontal: Theme.layout.padding.horizontal,
        paddingTop: Theme.spacing.xxl,
    },
    header: {
        marginBottom: Theme.spacing.xl,
    },
    headerTitle: {
        fontSize: Theme.typography.fontSize['2xl'],
        fontWeight: '700',
        color: Theme.colors.text.primary,
    },
    calendarContainer: {
        borderRadius: Theme.radius.xl,
        overflow: 'hidden',
        backgroundColor: Theme.colors.glass.medium,
        borderWidth: 1,
        borderColor: Theme.colors.glass.border,
        padding: Theme.spacing.lg,
        marginBottom: Theme.spacing.xl,
        ...Theme.shadows.md,
    },
    monthNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.spacing.lg,
    },
    navButton: {
        width: 36,
        height: 36,
        borderRadius: Theme.radius.md,
        backgroundColor: Theme.colors.glass.dark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthText: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '700',
        color: Theme.colors.text.primary,
    },
    weekdayContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Theme.spacing.md,
    },
    weekdayText: {
        width: '14%',
        textAlign: 'center',
        fontSize: Theme.typography.fontSize.xs,
        fontWeight: '700',
        color: Theme.colors.text.muted,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    dayContainer: {
        width: '14%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Theme.spacing.sm,
    },
    dayCircle: {
        width: 36,
        height: 36,
        borderRadius: Theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCircleSelected: {
        backgroundColor: Theme.colors.text.primary,
    },
    dayCircleToday: {
        backgroundColor: Theme.colors.glass.medium,
        borderWidth: 1.5,
        borderColor: Theme.colors.glass.border,
    },
    dayText: {
        fontSize: Theme.typography.fontSize.sm,
        fontWeight: '600',
        color: Theme.colors.text.primary,
    },
    dayTextSelected: {
        color: Theme.colors.background.primary,
        fontWeight: '700',
    },
    dayTextOtherMonth: {
        color: Theme.colors.text.disabled,
    },
    eventIndicators: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 2,
    },
    eventDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    dateHeader: {
        marginBottom: Theme.spacing.lg,
    },
    dateTitle: {
        fontSize: Theme.typography.fontSize.xl,
        fontWeight: '700',
        color: Theme.colors.text.primary,
        marginBottom: Theme.spacing.xs,
    },
    dateSubtitle: {
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.muted,
    },
    eventsList: {
        gap: Theme.spacing.lg,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xxxl,
        backgroundColor: Theme.colors.glass.dark,
        borderRadius: Theme.radius.xl,
        borderWidth: 1,
        borderColor: Theme.colors.glass.borderLight,
    },
    emptyTitle: {
        marginTop: Theme.spacing.lg,
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
        paddingHorizontal: Theme.spacing.xl,
    },
});
