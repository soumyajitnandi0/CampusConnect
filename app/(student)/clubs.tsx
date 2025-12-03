import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useAuth } from '../../contexts/auth.context';
import { ClubService } from '../../services/club.service';
import { Club } from '../../types/models';

export default function ClubsScreen() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [followedClubIds, setFollowedClubIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [following, setFollowing] = useState<string | null>(null);
    const router = useRouter();
    const { user } = useAuth();

    const fetchClubs = async () => {
        try {
            const allClubs = await ClubService.getClubs();
            setClubs(allClubs);

            // Fetch followed clubs to check which ones user is following
            if (user) {
                try {
                    const followed = await ClubService.getFollowedClubs();
                    const followedIds = new Set(followed.map(c => c.id));
                    setFollowedClubIds(followedIds);
                } catch (err) {
                    // User might not be logged in or no followed clubs
                    console.log('No followed clubs');
                }
            }
        } catch (err: any) {
            console.error('Error fetching clubs:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchClubs();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchClubs();
    };

    const handleFollow = async (clubId: string) => {
        if (!user) {
            Alert.alert('Login Required', 'Please login to follow clubs');
            return;
        }

        try {
            setFollowing(clubId);
            const isFollowing = followedClubIds.has(clubId);

            if (isFollowing) {
                await ClubService.unfollowClub(clubId);
                setFollowedClubIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(clubId);
                    return newSet;
                });
            } else {
                await ClubService.followClub(clubId);
                setFollowedClubIds(prev => new Set(prev).add(clubId));
            }

            // Update follower count in local state
            setClubs(prevClubs =>
                prevClubs.map(club =>
                    club.id === clubId
                        ? {
                              ...club,
                              followerCount: isFollowing
                                  ? club.followerCount - 1
                                  : club.followerCount + 1,
                          }
                        : club
                )
            );
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update follow status');
        } finally {
            setFollowing(null);
        }
    };

    const renderClub = ({ item }: { item: Club }) => {
        const isFollowing = followedClubIds.has(item.id);
        const isFollowingLoading = following === item.id;

        return (
            <TouchableOpacity
                onPress={() => router.push({
                    pathname: '/(student)/club-details',
                    params: { clubId: item.id }
                })}
                className="px-6 mb-4"
            >
                <GlassContainer className="p-4" intensity={20}>
                    <View className="flex-row items-center">
                        {item.imageUrl ? (
                            <Image
                                source={{ uri: item.imageUrl }}
                                style={{ width: 60, height: 60, borderRadius: 12 }}
                                contentFit="cover"
                            />
                        ) : (
                            <View className="w-15 h-15 rounded-xl bg-purple-500/20 items-center justify-center">
                                <FontAwesome name="group" size={24} color="#A855F7" />
                            </View>
                        )}
                        <View className="flex-1 ml-4">
                            <Text className="text-white font-bold text-lg mb-1">{item.name}</Text>
                            <Text className="text-gray-400 text-sm" numberOfLines={2}>
                                {item.description}
                            </Text>
                            <View className="flex-row items-center mt-2">
                                <FontAwesome name="users" size={12} color="#9CA3AF" />
                                <Text className="text-gray-500 text-xs ml-1">
                                    {item.followerCount} {item.followerCount === 1 ? 'follower' : 'followers'}
                                </Text>
                                {item.category && (
                                    <>
                                        <Text className="text-gray-500 text-xs mx-2">•</Text>
                                        <Text className="text-gray-500 text-xs">{item.category}</Text>
                                    </>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                handleFollow(item.id);
                            }}
                            disabled={isFollowingLoading || !user}
                            className="ml-3 px-4 py-2 rounded-xl"
                            style={{
                                backgroundColor: isFollowing ? '#10B981' : '#3B82F6',
                                opacity: isFollowingLoading ? 0.7 : 1,
                            }}
                        >
                            {isFollowingLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text className="text-white font-bold text-xs">
                                    {isFollowing ? 'Following' : 'Follow'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </GlassContainer>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color="#FFFFFF" />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <View className="px-6 pt-4 pb-4">
                <GlassContainer className="flex-row items-center justify-between p-6" intensity={20}>
                    <View>
                        <Text className="text-3xl font-bold text-white">Clubs</Text>
                        <Text className="text-gray-300 text-sm mt-1">Discover and follow clubs</Text>
                    </View>
                    <View className="w-12 h-12 rounded-full bg-purple-500/20 items-center justify-center">
                        <FontAwesome name="group" size={24} color="#A855F7" />
                    </View>
                </GlassContainer>
            </View>

            <FlatList
                data={clubs}
                renderItem={renderClub}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#FFFFFF"
                    />
                }
                ListEmptyComponent={
                    <View className="items-center mt-20 px-6">
                        <FontAwesome name="group" size={48} color="#4B5563" />
                        <Text className="text-center mt-4 text-gray-400 text-base font-semibold">
                            No clubs available
                        </Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            />
        </ScreenWrapper>
    );
}


