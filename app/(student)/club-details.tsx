import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { EventCard } from '../../components/event-card';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useAuth } from '../../contexts/auth.context';
import { ClubService } from '../../services/club.service';
import { EventService } from '../../services/event.service';
import { Club, Event } from '../../types/models';

export default function ClubDetailsScreen() {
    const { clubId } = useLocalSearchParams<{ clubId: string }>();
    const [club, setClub] = useState<Club | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [following, setFollowing] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const [clubData, eventsData] = await Promise.all([
                ClubService.getClubById(clubId),
                ClubService.getClubEvents(clubId)
            ]);
            setClub(clubData);
            setEvents(eventsData.map((e: any) => EventService.transformEvent(e)));

            // Check if user is following
            if (user) {
                try {
                    const followed = await ClubService.getFollowedClubs();
                    setIsFollowing(followed.some(c => c.id === clubId));
                } catch (err) {
                    setIsFollowing(false);
                }
            }
        } catch (err: any) {
            Alert.alert('Error', 'Failed to load club details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (clubId) {
            fetchData();
        }
    }, [clubId, user]);

    const onRefresh = () => {
        fetchData();
    };

    const handleFollow = async () => {
        if (!user) {
            Alert.alert('Login Required', 'Please login to follow clubs');
            return;
        }

        try {
            setFollowing(true);
            if (isFollowing) {
                await ClubService.unfollowClub(clubId);
                setIsFollowing(false);
                if (club) {
                    setClub({ ...club, followerCount: club.followerCount - 1 });
                }
            } else {
                await ClubService.followClub(clubId);
                setIsFollowing(true);
                if (club) {
                    setClub({ ...club, followerCount: club.followerCount + 1 });
                }
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update follow status');
        } finally {
            setFollowing(false);
        }
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
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />
                }
            >
                <View className="p-4">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-4">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full items-center justify-center bg-white/10"
                        >
                            <FontAwesome name="arrow-left" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-white">Club Details</Text>
                        <View className="w-10" />
                    </View>

                    {/* Club Header */}
                    <GlassContainer className="p-6 mb-4">
                        <View className="flex-row items-center mb-4">
                            {club.imageUrl ? (
                                <Image
                                    source={{ uri: club.imageUrl }}
                                    style={{ width: 80, height: 80, borderRadius: 16 }}
                                    contentFit="cover"
                                />
                            ) : (
                                <View className="w-20 h-20 rounded-2xl bg-purple-500/20 items-center justify-center">
                                    <FontAwesome name="group" size={32} color="#A855F7" />
                                </View>
                            )}
                            <View className="flex-1 ml-4">
                                <Text className="text-2xl font-bold mb-2 text-white">{club.name}</Text>
                                <View className="flex-row items-center">
                                    <FontAwesome name="users" size={14} color="#9CA3AF" />
                                    <Text className="text-gray-400 text-sm ml-2">
                                        {club.followerCount} {club.followerCount === 1 ? 'follower' : 'followers'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <Text className="text-gray-300 text-base mb-4">{club.description}</Text>
                        {club.category && (
                            <View className="px-3 py-1 rounded-full bg-purple-500/20 self-start mb-4">
                                <Text className="text-purple-300 text-xs font-semibold">{club.category}</Text>
                            </View>
                        )}
                        {user && (
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={handleFollow}
                                    disabled={following}
                                    className="flex-1 rounded-xl overflow-hidden"
                                >
                                    <View
                                        className="py-3 items-center justify-center"
                                        style={{
                                            backgroundColor: isFollowing ? '#10B981' : '#3B82F6',
                                            opacity: following ? 0.7 : 1,
                                        }}
                                    >
                                        {following ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text className="text-white font-bold text-base">
                                                {isFollowing ? 'Following' : 'Follow Club'}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                                {isFollowing && (
                                    <TouchableOpacity
                                        onPress={() => router.push({
                                            pathname: '/(student)/club-chat',
                                            params: { clubId: clubId }
                                        })}
                                        className="flex-1 rounded-xl overflow-hidden bg-purple-500/20 border border-purple-500/30"
                                    >
                                        <View className="py-3 items-center justify-center flex-row">
                                            <FontAwesome name="comments" size={16} color="#A855F7" style={{ marginRight: 6 }} />
                                            <Text className="text-purple-300 font-bold text-base">Chat</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </GlassContainer>

                    {/* Events Section */}
                    <GlassContainer className="p-4">
                        <Text className="text-xl font-bold mb-4 text-white">
                            Club Events ({events.length})
                        </Text>
                        {events.length > 0 ? (
                            <FlatList
                                data={events}
                                renderItem={({ item }) => (
                                    <EventCard
                                        event={item}
                                        onPress={() => router.push({
                                            pathname: '/event/[id]',
                                            params: { id: item.id }
                                        })}
                                        showActions={false}
                                    />
                                )}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                            />
                        ) : (
                            <View className="items-center py-8">
                                <FontAwesome name="calendar-times-o" size={32} color="#6B7280" />
                                <Text className="text-gray-500 mt-2">No events yet</Text>
                            </View>
                        )}
                    </GlassContainer>

                    <View className="h-10" />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

