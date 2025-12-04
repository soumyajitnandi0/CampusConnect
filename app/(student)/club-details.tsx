import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EventCard } from '../../components/event-card';
import { PillTag } from '../../components/ui/PillTag';
import { PremiumGlassCard } from '../../components/ui/PremiumGlassCard';
import { PremiumHeader } from '../../components/ui/PremiumHeader';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../contexts/auth.context';
import { ClubService } from '../../services/club.service';
import { EventService } from '../../services/event.service';
import { Club, Event } from '../../types/models';
import { getClubImageUrl } from '../../utils/cloudinary';
import { hexToRgba } from '../../utils/colorUtils';

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
                <ActivityIndicator size="large" color={Theme.colors.text.primary} />
            </ScreenWrapper>
        );
    }

    if (!club) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <Text style={styles.errorText}>Club not found</Text>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <PremiumHeader title="Club Details" />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor={Theme.colors.text.primary} 
                    />
                }
            >
                {/* Club Header Card */}
                <PremiumGlassCard intensity={25} gradient style={styles.clubCard}>
                    <View style={styles.clubHeader}>
                        {/* Club Icon/Image */}
                        <View style={styles.iconContainer}>
                            {club.imageUrl ? (
                                <Image
                                    source={{ 
                                        uri: (club.imageUrl.includes('cloudinary.com') || (!club.imageUrl.includes('http://') && !club.imageUrl.includes('https://')))
                                            ? getClubImageUrl(club.imageUrl, 320)
                                            : club.imageUrl
                                    }}
                                    style={styles.clubImage}
                                    contentFit="cover"
                                />
                            ) : (
                                <LinearGradient
                                    colors={[hexToRgba(Theme.colors.accent.purple, 0.3), hexToRgba(Theme.colors.accent.purple, 0.1)]}
                                    style={styles.clubImagePlaceholder}
                                >
                                    <FontAwesome name="group" size={32} color={Theme.colors.accent.purpleLight} />
                                </LinearGradient>
                            )}
                        </View>

                        {/* Club Info */}
                        <View style={styles.clubInfo}>
                            <Text style={styles.clubName}>{club.name}</Text>
                            <View style={styles.followerRow}>
                                <FontAwesome name="users" size={14} color={Theme.colors.text.muted} />
                                <Text style={styles.followerText}>
                                    {club.followerCount} {club.followerCount === 1 ? 'follower' : 'followers'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.description}>{club.description}</Text>

                    {/* Category Tag */}
                    {club.category && (
                        <View style={styles.tagContainer}>
                            <PillTag label={club.category} variant="category" />
                        </View>
                    )}

                    {/* Action Buttons */}
                    {user && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                onPress={handleFollow}
                                disabled={following}
                                style={[
                                    styles.followButton,
                                    isFollowing && styles.followButtonActive
                                ]}
                                activeOpacity={0.8}
                            >
                                <BlurView intensity={isFollowing ? 20 : 15} tint="dark" style={StyleSheet.absoluteFill} />
                                <LinearGradient
                                    colors={isFollowing 
                                        ? [hexToRgba(Theme.colors.accent.green, 0.3), hexToRgba(Theme.colors.accent.green, 0.1)]
                                        : [Theme.colors.glass.medium, Theme.colors.glass.dark]
                                    }
                                    style={StyleSheet.absoluteFill}
                                />
                                {following ? (
                                    <ActivityIndicator size="small" color={isFollowing ? Theme.colors.accent.green : Theme.colors.text.primary} />
                                ) : (
                                    <Text style={[
                                        styles.followButtonText,
                                        isFollowing && styles.followButtonTextActive
                                    ]}>
                                        {isFollowing ? 'Following' : 'Follow Club'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {isFollowing && (
                                <TouchableOpacity
                                    onPress={() => router.push({
                                        pathname: '/(student)/club-chat',
                                        params: { clubId: clubId }
                                    })}
                                    style={styles.chatButton}
                                    activeOpacity={0.8}
                                >
                                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                <LinearGradient
                                    colors={[hexToRgba(Theme.colors.accent.purple, 0.3), hexToRgba(Theme.colors.accent.purple, 0.1)]}
                                    style={StyleSheet.absoluteFill}
                                />
                                    <FontAwesome name="comments" size={20} color={Theme.colors.accent.purpleLight} />
                                    <Text style={styles.chatButtonText}>Chat</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </PremiumGlassCard>

                {/* Events Section */}
                <PremiumGlassCard intensity={20} gradient style={styles.eventsCard}>
                    <SectionTitle 
                        title="Club Events" 
                        subtitle={`${events.length} ${events.length === 1 ? 'event' : 'events'}`}
                    />
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
                        <View style={styles.emptyState}>
                            <FontAwesome name="calendar-times-o" size={48} color={Theme.colors.text.disabled} />
                            <Text style={styles.emptyTitle}>No events yet</Text>
                            <Text style={styles.emptySubtitle}>Check back later for upcoming events</Text>
                        </View>
                    )}
                </PremiumGlassCard>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Theme.layout.padding.horizontal,
        paddingTop: Theme.spacing.xl,
        paddingBottom: 120,
    },
    clubCard: {
        marginBottom: Theme.spacing.xl,
    },
    clubHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.spacing.lg,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: Theme.radius.xl,
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
    },
    clubName: {
        fontSize: Theme.typography.fontSize['2xl'],
        fontWeight: '700',
        color: Theme.colors.text.primary,
        marginBottom: Theme.spacing.xs,
    },
    followerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.xs,
    },
    followerText: {
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.muted,
        fontWeight: '500',
    },
    description: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '500',
        color: Theme.colors.text.secondary,
        lineHeight: Theme.typography.fontSize.base * Theme.typography.lineHeight.normal,
        marginBottom: Theme.spacing.lg,
    },
    tagContainer: {
        marginBottom: Theme.spacing.lg,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: Theme.spacing.md,
    },
    followButton: {
        flex: 1,
        height: 52,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Theme.colors.glass.border,
    },
    followButtonActive: {
        borderColor: hexToRgba(Theme.colors.accent.green, 0.5),
    },
    followButtonText: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '700',
        color: Theme.colors.text.primary,
    },
    followButtonTextActive: {
        color: Theme.colors.accent.greenLight,
    },
    chatButton: {
        height: 52,
        paddingHorizontal: Theme.spacing.xl,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Theme.spacing.sm,
        borderWidth: 1,
        borderColor: hexToRgba(Theme.colors.accent.purple, 0.5),
    },
    chatButtonText: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '700',
        color: Theme.colors.accent.purpleLight,
    },
    eventsCard: {
        marginBottom: Theme.spacing.xl,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xxxl,
    },
    emptyTitle: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '600',
        color: Theme.colors.text.secondary,
        marginTop: Theme.spacing.lg,
    },
    emptySubtitle: {
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.muted,
        marginTop: Theme.spacing.xs,
        textAlign: 'center',
    },
    bottomSpacer: {
        height: Theme.spacing.xl,
    },
    errorText: {
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.text.muted,
    },
});
