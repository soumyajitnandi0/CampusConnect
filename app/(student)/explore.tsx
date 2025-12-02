import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EventCard } from '../../components/event-card';
import { useAuth } from '../../contexts/auth.context';
import { useEvents } from '../../contexts/events.context';
import { Event } from '../../types/models';
import { formatEventDate } from '../../utils/event.utils';

export default function ExploreScreen() {
    const router = useRouter();
    const { events, loading, rsvpForEvent, cancelRSVP, isUserRSVPd, refreshEvents } = useEvents();
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshEvents();
        setRefreshing(false);
    };

    const handleRSVP = async (eventId: string) => {
        try {
            if (isUserRSVPd(eventId)) {
                await cancelRSVP(eventId);
            } else {
                await rsvpForEvent(eventId);
            }
        } catch (error: any) {
            alert(error.message || 'RSVP action failed');
        }
    };

    const handleEventPress = (event: Event) => {
        router.push({
            pathname: '/event/[id]',
            params: { id: event.id },
        });
    };

    // Get current week dates
    const getWeekDates = () => {
        const today = new Date();
        const currentDay = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDay + 1); // Monday

        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            weekDates.push(date);
        }
        return weekDates;
    };

    const weekDates = getWeekDates();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

        // Filter by selected date if in calendar mode
        if (viewMode === 'calendar') {
            filtered = filtered.filter(event => {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate.getTime() === selectedDate.getTime();
            });
        }

        // Sort by date (upcoming first)
        return filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateA - dateB;
        });
    }, [events, searchQuery, selectedDate, viewMode]);

    // Group events by date for calendar view
    const eventsByDate = useMemo(() => {
        const grouped: { [key: string]: Event[] } = {};
        filteredEvents.forEach(event => {
            const eventDate = new Date(event.date);
            const dateKey = eventDate.toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(event);
        });
        return grouped;
    }, [filteredEvents]);

    // Get events count for a specific date
    const getEventsCountForDate = (date: Date) => {
        const dateKey = date.toDateString();
        return eventsByDate[dateKey]?.length || 0;
    };

    // Check if date has events
    const hasEvents = (date: Date) => {
        return getEventsCountForDate(date) > 0;
    };

    // Check if date is today
    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    // Group events by time of day
    const groupEventsByTime = (events: Event[]) => {
        const morning: Event[] = [];
        const afternoon: Event[] = [];
        const evening: Event[] = [];

        events.forEach(event => {
            const eventDate = new Date(event.date);
            const hour = eventDate.getHours();

            if (hour >= 5 && hour < 12) {
                morning.push(event);
            } else if (hour >= 12 && hour < 17) {
                afternoon.push(event);
            } else {
                evening.push(event);
            }
        });

        return { morning, afternoon, evening };
    };

    const renderCalendarView = () => {
        const selectedDateEvents = eventsByDate[selectedDate.toDateString()] || [];
        const { morning, afternoon, evening } = groupEventsByTime(selectedDateEvents);

        return (
            <ScrollView className="flex-1 bg-gray-50 rounded-t-3xl pt-6 px-6">
                {selectedDateEvents.length === 0 ? (
                    <View className="items-center py-12">
                        <FontAwesome name="calendar-times-o" size={48} color="#9CA3AF" />
                        <Text className="text-center mt-4 text-gray-500 text-base font-semibold">
                            No events on this date
                        </Text>
                        <Text className="text-center mt-2 text-gray-400 text-sm">
                            Select another date to see events
                        </Text>
                    </View>
                ) : (
                    <>
                        {morning.length > 0 && (
                            <>
                                <Text className="text-gray-500 font-bold mb-4 text-xs tracking-widest">MORNING</Text>
                                {morning.map((event) => (
                                    <TouchableOpacity
                                        key={event.id}
                                        onPress={() => handleEventPress(event)}
                                        className="bg-white p-4 rounded-xl mb-4 shadow-sm"
                                        style={{
                                            borderLeftWidth: 4,
                                            borderLeftColor: '#3B82F6',
                                        }}
                                    >
                                        <View className="flex-row items-center mb-2">
                                            <FontAwesome name="clock-o" size={14} color="#3B82F6" />
                                            <Text className="text-gray-500 text-xs ml-2">
                                                {formatEventDate(event.date)}
                                            </Text>
                                        </View>
                                        <Text className="font-bold text-lg mb-1 text-gray-900">{event.title}</Text>
                                        <Text className="text-gray-400 text-xs">{event.location}</Text>
                                        {event.description && (
                                            <Text className="text-gray-600 text-sm mt-2" numberOfLines={2}>
                                                {event.description}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        {afternoon.length > 0 && (
                            <>
                                <Text className="text-gray-500 font-bold mb-4 text-xs tracking-widest mt-2">AFTERNOON</Text>
                                {afternoon.map((event) => (
                                    <TouchableOpacity
                                        key={event.id}
                                        onPress={() => handleEventPress(event)}
                                        className="bg-white p-4 rounded-xl mb-4 shadow-sm"
                                        style={{
                                            borderLeftWidth: 4,
                                            borderLeftColor: '#22C55E',
                                        }}
                                    >
                                        <View className="flex-row items-center mb-2">
                                            <FontAwesome name="clock-o" size={14} color="#22C55E" />
                                            <Text className="text-gray-500 text-xs ml-2">
                                                {formatEventDate(event.date)}
                                            </Text>
                                        </View>
                                        <Text className="font-bold text-lg mb-1 text-gray-900">{event.title}</Text>
                                        <Text className="text-gray-400 text-xs">{event.location}</Text>
                                        {event.description && (
                                            <Text className="text-gray-600 text-sm mt-2" numberOfLines={2}>
                                                {event.description}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        {evening.length > 0 && (
                            <>
                                <Text className="text-gray-500 font-bold mb-4 text-xs tracking-widest mt-2">EVENING</Text>
                                {evening.map((event) => (
                                    <TouchableOpacity
                                        key={event.id}
                                        onPress={() => handleEventPress(event)}
                                        className="bg-white p-4 rounded-xl mb-4 shadow-sm"
                                        style={{
                                            borderLeftWidth: 4,
                                            borderLeftColor: '#EAB308',
                                        }}
                                    >
                                        <View className="flex-row items-center mb-2">
                                            <FontAwesome name="clock-o" size={14} color="#EAB308" />
                                            <Text className="text-gray-500 text-xs ml-2">
                                                {formatEventDate(event.date)}
                                            </Text>
                                        </View>
                                        <Text className="font-bold text-lg mb-1 text-gray-900">{event.title}</Text>
                                        <Text className="text-gray-400 text-xs">{event.location}</Text>
                                        {event.description && (
                                            <Text className="text-gray-600 text-sm mt-2" numberOfLines={2}>
                                                {event.description}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                    </>
                )}
                <View className="h-20" />
            </ScrollView>
        );
    };

    const renderListView = () => {
        return (
            <FlatList
                data={filteredEvents}
                renderItem={({ item }) => (
                    <EventCard
                        event={item}
                        onPress={() => handleEventPress(item)}
                        onRSVP={() => handleRSVP(item.id)}
                        isRSVPd={isUserRSVPd(item.id)}
                        showActions={true}
                    />
                )}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#2563EB"
                    />
                }
                ListEmptyComponent={
                    <View className="items-center mt-20 px-6">
                        <FontAwesome name="calendar-times-o" size={48} color="#9CA3AF" />
                        <Text className="text-center mt-4 text-gray-500 text-base font-semibold">
                            {searchQuery ? 'No events match your search' : 'No events found'}
                        </Text>
                        <Text className="text-center mt-2 text-gray-400 text-sm">
                            {searchQuery ? 'Try a different search term' : 'Check back later for exciting events!'}
                        </Text>
                    </View>
                }
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 100, paddingHorizontal: 16 }}
            />
        );
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
        setSelectedDate(newDate);
    };

    if (loading && events.length === 0) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white pt-12">
            {/* Header */}
            <View className="px-6 mb-4">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-2xl font-bold text-gray-900">Explore Events</Text>
                    <View className="flex-row bg-gray-100 rounded-lg p-1">
                        <TouchableOpacity
                            onPress={() => setViewMode('list')}
                            className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white' : ''}`}
                            style={{
                                shadowColor: viewMode === 'list' ? '#000' : 'transparent',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: viewMode === 'list' ? 0.1 : 0,
                                shadowRadius: 2,
                                elevation: viewMode === 'list' ? 2 : 0,
                            }}
                        >
                            <Text className={`text-sm font-semibold ${viewMode === 'list' ? 'text-gray-900' : 'text-gray-500'}`}>
                                List
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setViewMode('calendar')}
                            className={`px-3 py-1 rounded ${viewMode === 'calendar' ? 'bg-white' : ''}`}
                            style={{
                                shadowColor: viewMode === 'calendar' ? '#000' : 'transparent',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: viewMode === 'calendar' ? 0.1 : 0,
                                shadowRadius: 2,
                                elevation: viewMode === 'calendar' ? 2 : 0,
                            }}
                        >
                            <Text className={`text-sm font-semibold ${viewMode === 'calendar' ? 'text-gray-900' : 'text-gray-500'}`}>
                                Calendar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                <View
                    className="rounded-xl px-4 py-3 flex-row items-center mb-4"
                    style={{
                        backgroundColor: '#F9FAFB',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                    }}
                >
                    <FontAwesome name="search" size={16} color="#9CA3AF" />
                    <TextInput
                        placeholder="Search events..."
                        placeholderTextColor="#9CA3AF"
                        className="ml-2 flex-1 text-gray-900"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <FontAwesome name="times-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {viewMode === 'calendar' && (
                    <>
                        {/* Month Navigation */}
                        <View className="flex-row justify-between items-center mb-4">
                            <TouchableOpacity onPress={() => navigateWeek('prev')}>
                                <FontAwesome name="chevron-left" size={16} color="#374151" />
                            </TouchableOpacity>
                            <View className="items-center">
                                <Text className="text-lg font-bold text-gray-900">
                                    {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => navigateWeek('next')}>
                                <FontAwesome name="chevron-right" size={16} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        {/* Calendar Strip */}
                        <View className="flex-row justify-between mb-4">
                            {weekDates.map((date, index) => {
                                const dateStr = date.toDateString();
                                const isSelected = dateStr === selectedDate.toDateString();
                                const eventCount = getEventsCountForDate(date);
                                const isTodayDate = isToday(date);

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => setSelectedDate(date)}
                                        className="items-center flex-1"
                                    >
                                        <Text className="text-gray-400 text-xs mb-2">
                                            {date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                                        </Text>
                                        <View
                                            className={`w-10 h-10 rounded-full justify-center items-center ${
                                                isSelected ? 'bg-blue-600' : isTodayDate ? 'bg-blue-100' : 'bg-transparent'
                                            }`}
                                        >
                                            <Text
                                                className={`font-bold text-sm ${
                                                    isSelected ? 'text-white' : isTodayDate ? 'text-blue-600' : 'text-gray-900'
                                                }`}
                                            >
                                                {date.getDate()}
                                            </Text>
                                        </View>
                                        {eventCount > 0 && (
                                            <View className="flex-row mt-1 space-x-0.5">
                                                {eventCount > 0 && <View className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                                {eventCount > 1 && <View className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                                {eventCount > 2 && <View className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                )}
            </View>

            {/* Content */}
            {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
        </View>
    );
}
