import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { GlassInput } from '../../components/ui/GlassInput';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
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

    // Get days for the current month view (including padding)
    const getCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfMonth.getDate();
        const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

        const days: Date[] = [];

        // Add padding for previous month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const date = new Date(year, month, -i); // This actually goes back to prev month
            // Correct way to get prev month days in order:
            // If startingDayOfWeek is 3 (Wed), we need Sun, Mon, Tue.
            // i=0 -> last day of prev month (Tue?) No.
            // Let's do it simpler.
        }

        // Re-do padding logic
        // Start date of the grid
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - startingDayOfWeek);

        // We want 6 weeks to cover all possibilities (42 days)
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            days.push(date);
        }

        return days;
    };

    const calendarDays = useMemo(() => getCalendarDays(), [currentMonth]);

    // Filter and sort events
    const filteredEvents = useMemo(() => {
        let filtered = events;

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(query) ||
                event.description.toLowerCase().includes(query) ||
                event.location.toLowerCase().includes(query)
            );
        }

        // Filter by selected date
        filtered = filtered.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            const selected = new Date(selectedDate);
            selected.setHours(0, 0, 0, 0);
            return eventDate.getTime() === selected.getTime();
        });

        // Sort by time
        return filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateA - dateB;
        });
    }, [events, searchQuery, selectedDate]);

    // Group events by date for dot indicators
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
                <ActivityIndicator size="large" color="#FFFFFF" />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#FFFFFF"
                    />
                }
            >
                <View className="pt-4 px-6 pb-20 w-full max-w-4xl self-center">
                    {/* Header */}
                    <View className="mb-6">
                        <Text className="text-2xl font-bold text-white mb-4">Explore Events</Text>

                        {/* Search Bar */}
                        <GlassInput
                            placeholder="Search events..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            icon="search"
                            containerStyle={{ marginBottom: 0 }}
                        />
                    </View>

                    {/* Calendar Section */}
                    <GlassContainer className="p-3 mb-4" intensity={20}>
                        {/* Month Navigation */}
                        <View className="flex-row justify-between items-center mb-4">
                            <TouchableOpacity onPress={() => navigateMonth('prev')} className="p-2">
                                <FontAwesome name="chevron-left" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text className="text-base font-bold text-white">
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </Text>
                            <TouchableOpacity onPress={() => navigateMonth('next')} className="p-2">
                                <FontAwesome name="chevron-right" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Weekday Headers */}
                        <View className="flex-row justify-between mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                <Text key={index} className="text-gray-400 text-[10px] font-bold w-8 text-center">
                                    {day}
                                </Text>
                            ))}
                        </View>

                        {/* Calendar Grid */}
                        <View className="flex-row flex-wrap justify-between">
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
                                            // If clicking a date from another month, switch to that month
                                            if (!isCurrentMonth) {
                                                setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                                            }
                                        }}
                                        className="w-[14%] aspect-square items-center justify-center mb-1"
                                    >
                                        <View
                                            className={`w-7 h-7 rounded-full items-center justify-center ${selected
                                                ? 'bg-white'
                                                : today
                                                    ? 'bg-white/20 border border-white/30'
                                                    : 'bg-transparent'
                                                }`}
                                        >
                                            <Text
                                                className={`text-xs font-medium ${selected
                                                    ? 'text-black font-bold'
                                                    : isCurrentMonth
                                                        ? 'text-white'
                                                        : 'text-gray-600'
                                                    }`}
                                            >
                                                {date.getDate()}
                                            </Text>
                                        </View>

                                        {/* Event Dots */}
                                        <View className="flex-row mt-0.5 h-1 space-x-0.5">
                                            {eventCount > 0 && (
                                                <View className={`w-0.5 h-0.5 rounded-full ${selected ? 'bg-black' : 'bg-blue-400'}`} />
                                            )}
                                            {eventCount > 1 && (
                                                <View className={`w-0.5 h-0.5 rounded-full ${selected ? 'bg-black' : 'bg-purple-400'}`} />
                                            )}
                                            {eventCount > 2 && (
                                                <View className={`w-0.5 h-0.5 rounded-full ${selected ? 'bg-black' : 'bg-pink-400'}`} />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </GlassContainer>

                    {/* Selected Date Header */}
                    <View className="mb-4">
                        <Text className="text-white font-bold text-lg">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} scheduled
                        </Text>
                    </View>

                    {/* Events List */}
                    {filteredEvents.length > 0 ? (
                        <View>
                            {filteredEvents.map((event) => (
                                <TouchableOpacity
                                    key={event.id}
                                    onPress={() => handleEventPress(event)}
                                    className="mb-4"
                                >
                                    <GlassContainer className="p-4" intensity={20}>
                                        <View className="flex-row justify-between items-start mb-2">
                                            <View className="flex-1 mr-2">
                                                <Text className="font-bold text-lg text-white mb-1">{event.title}</Text>
                                                <View className="flex-row items-center">
                                                    <FontAwesome name="map-marker" size={12} color="#9CA3AF" />
                                                    <Text className="text-gray-400 text-xs ml-1">{event.location}</Text>
                                                </View>
                                            </View>
                                            <View className="bg-white/10 px-3 py-1 rounded-lg items-center">
                                                <Text className="text-white font-bold text-xs">
                                                    {new Date(event.date).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit'
                                                    })}
                                                </Text>
                                            </View>
                                        </View>

                                        {event.description && (
                                            <Text className="text-gray-300 text-sm mt-2" numberOfLines={2}>
                                                {event.description}
                                            </Text>
                                        )}

                                        <View className="mt-3 flex-row items-center justify-between">
                                            <View className="flex-row items-center">
                                                <FontAwesome name="users" size={12} color="#60A5FA" />
                                                <Text className="text-blue-400 text-xs ml-1 font-medium">
                                                    {event.rsvpCount || 0} attending
                                                </Text>
                                            </View>
                                            {event.category && (
                                                <View className="bg-purple-500/20 px-2 py-0.5 rounded">
                                                    <Text className="text-purple-300 text-[10px] font-bold uppercase">
                                                        {event.category}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </GlassContainer>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View className="items-center py-12 bg-white/5 rounded-2xl border border-white/10">
                            <FontAwesome name="calendar-o" size={48} color="#4B5563" />
                            <Text className="text-center mt-4 text-gray-300 text-base font-semibold">
                                No events on this date
                            </Text>
                            <Text className="text-center mt-2 text-gray-500 text-sm px-6">
                                Try selecting a date with dots to see scheduled events.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}
