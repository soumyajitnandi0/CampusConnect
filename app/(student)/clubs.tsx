import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../contexts/auth.context';
import { ClubService } from '../../services/club.service';
import { Club } from '../../types/models';
import { getClubImageUrl } from '../../utils/cloudinary';
import { hexToRgba } from '../../utils/colorUtils';

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

            if (user) {
                try {
                    const followed = await ClubService.getFollowedClubs();
                    const followedIds = new Set(followed.map(c => c.id));
                    setFollowedClubIds(followedIds);
                } catch (err) {
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
                style={styles.clubCardContainer}
                activeOpacity={0.9}
            >
                <View style={styles.clubCard}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    
                    <View style={styles.clubContent}>
                        {/* Club Image/Icon */}
                        <View style={styles.clubImageContainer}>
                            {item.imageUrl ? (
                                <Image
                                    source={{ 
                                        uri: (item.imageUrl.includes('cloudinary.com') || (!item.imageUrl.includes('http://') && !item.imageUrl.includes('https://')))
                                            ? getClubImageUrl(item.imageUrl, 200)
                                            : item.imageUrl
                                    }}
                                    style={styles.clubImage}
                                    contentFit="cover"
                                />
                            ) : (
                                <LinearGradient
                                    colors={[hexToRgba(Theme.colors.accent.purple, 0.3), hexToRgba(Theme.colors.accent.purple, 0.1)]}
                                    style={styles.clubImagePlaceholder}
                                >
                                    <FontAwesome name="group" size={24} color={Theme.colors.accent.purpleLight} />
                                </LinearGradient>
                            )}
                        </View>

                        {/* Club Info */}
                        <View style={styles.clubInfo}>
                            <Text style={styles.clubName} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <Text style={styles.clubDescription} numberOfLines={2}>
                                {item.description}
                            </Text>
                            <View style={styles.clubMeta}>
                                <View style={styles.metaItem}>
                                    <FontAwesome name="users" size={12} color={Theme.colors.text.muted} />
                                    <Text style={styles.metaText}>
                                        {item.followerCount} {item.followerCount === 1 ? 'follower' : 'followers'}
                                    </Text>
                                </View>
                                {item.category && (
                                    <>
                                        <Text style={styles.metaSeparator}>•</Text>
                                        <Text style={styles.metaText}>{item.category}</Text>
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Follow Button */}
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                handleFollow(item.id);
                            }}
                            disabled={isFollowingLoading || !user}
                            style={[
                                styles.followButton,
                                isFollowing && styles.followButtonActive
                            ]}
                            activeOpacity={0.7}
                        >
                            <BlurView 
                                intensity={isFollowing ? 15 : 10} 
                                tint="dark" 
                                style={StyleSheet.absoluteFill} 
                            />
                            {isFollowingLoading ? (
                                <ActivityIndicator 
                                    size="small" 
                                    color={isFollowing ? Theme.colors.accent.green : Theme.colors.text.primary} 
                                />
                            ) : (
                                <Text style={[
                                    styles.followButtonText,
                                    isFollowing && styles.followButtonTextActive
                                ]}>
                                    {isFollowing ? 'Following' : 'Follow'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color={Theme.colors.text.primary} />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            {/* Premium Intro Card */}
            <View style={styles.headerContainer}>
                <View style={styles.introCard}>
                    <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                    <LinearGradient
                        colors={[hexToRgba(Theme.colors.accent.purple, 0.2), 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.introContent}>
                        <View style={styles.introIconContainer}>
                            <FontAwesome name="group" size={28} color={Theme.colors.accent.purpleLight} />
                        </View>
                        <View style={styles.introTextContainer}>
                            <Text style={styles.introTitle}>Clubs</Text>
                            <Text style={styles.introSubtitle}>Discover and follow clubs</Text>
                        </View>
                    </View>
                </View>
            </View>

            <FlatList
                data={clubs}
                renderItem={renderClub}
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
                        <FontAwesome name="group" size={56} color={Theme.colors.text.disabled} />
                        <Text style={styles.emptyTitle}>No clubs available</Text>
                        <Text style={styles.emptySubtitle}>Check back later for new clubs</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        paddingHorizontal: Theme.layout.padding.horizontal,
        paddingTop: Theme.spacing.xxl,
        paddingBottom: Theme.spacing.lg,
    },
    introCard: {
        borderRadius: Theme.radius.xl,
        overflow: 'hidden',
        backgroundColor: Theme.colors.glass.medium,
        borderWidth: 1,
        borderColor: Theme.colors.glass.border,
        ...Theme.shadows.md,
    },
    introContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.layout.cardPadding.vertical,
    },
    introIconContainer: {
        width: 56,
        height: 56,
        borderRadius: Theme.radius.md,
        backgroundColor: Theme.colors.accent.purple + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Theme.spacing.lg,
        borderWidth: 1,
        borderColor: Theme.colors.accent.purple + '40',
    },
    introTextContainer: {
        flex: 1,
    },
    introTitle: {
        fontSize: Theme.typography.fontSize['2xl'],
        fontWeight: '700',
        color: Theme.colors.text.primary,
        marginBottom: Theme.spacing.xs,
    },
    introSubtitle: {
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.muted,
        fontWeight: '500',
    },
    clubCardContainer: {
        marginHorizontal: Theme.layout.padding.horizontal,
        marginBottom: Theme.spacing.lg,
    },
    clubCard: {
        borderRadius: Theme.radius.xl,
        overflow: 'hidden',
        backgroundColor: Theme.colors.glass.medium,
        borderWidth: 1,
        borderColor: Theme.colors.glass.borderLight,
        ...Theme.shadows.sm,
    },
    clubContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.layout.cardPadding.vertical,
    },
    clubImageContainer: {
        width: 64,
        height: 64,
        borderRadius: Theme.radius.md,
        overflow: 'hidden',
        marginRight: Theme.spacing.lg,
    },
    clubImage: {
        width: '100%',
        height: '100%',
    },
    clubImagePlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    clubInfo: {
        flex: 1,
        marginRight: Theme.spacing.md,
    },
    clubName: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '700',
        color: Theme.colors.text.primary,
        marginBottom: Theme.spacing.xs,
    },
    clubDescription: {
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.tertiary,
        lineHeight: Theme.typography.fontSize.sm * Theme.typography.lineHeight.normal,
        marginBottom: Theme.spacing.sm,
    },
    clubMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.xs,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.xs,
    },
    metaText: {
        fontSize: Theme.typography.fontSize.xs,
        color: Theme.colors.text.muted,
    },
    metaSeparator: {
        fontSize: Theme.typography.fontSize.xs,
        color: Theme.colors.text.disabled,
    },
    followButton: {
        paddingHorizontal: Theme.spacing.xl,
        paddingVertical: Theme.spacing.sm,
        borderRadius: Theme.radius.full,
        backgroundColor: Theme.colors.glass.medium,
        borderWidth: 1,
        borderColor: Theme.colors.glass.border,
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    followButtonActive: {
        backgroundColor: Theme.colors.accent.green + '20',
        borderColor: Theme.colors.accent.green + '50',
    },
    followButtonText: {
        fontSize: Theme.typography.fontSize.xs,
        fontWeight: '700',
        color: Theme.colors.text.primary,
        letterSpacing: 0.5,
    },
    followButtonTextActive: {
        color: Theme.colors.accent.greenLight,
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
