import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { ClubService } from '../../services/club.service';
import { Club } from '../../types/models';

export default function ClubsScreen() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchClubs = async () => {
        try {
            const myClubs = await ClubService.getMyClubs();
            setClubs(myClubs);
        } catch (err: any) {
            console.error('Error fetching clubs:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchClubs();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchClubs();
    };

    const renderClub = ({ item }: { item: Club }) => (
        <TouchableOpacity
            onPress={() => router.push({
                pathname: '/(organizer)/club-details',
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
                        </View>
                    </View>
                    <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
                </View>
            </GlassContainer>
        </TouchableOpacity>
    );

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
                        <Text className="text-3xl font-bold text-white">My Clubs</Text>
                        <Text className="text-gray-300 text-sm mt-1">Manage your clubs</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/(organizer)/create-club')}
                        className="w-12 h-12 rounded-full bg-purple-500/20 items-center justify-center"
                    >
                        <FontAwesome name="plus" size={20} color="#A855F7" />
                    </TouchableOpacity>
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
                            No clubs created yet
                        </Text>
                        <Text className="text-center mt-2 text-gray-500 text-sm">
                            Create your first club to organize events!
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(organizer)/create-club')}
                            className="mt-6 px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30"
                        >
                            <Text className="text-purple-300 font-bold">Create Club</Text>
                        </TouchableOpacity>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            />
        </ScreenWrapper>
    );
}


