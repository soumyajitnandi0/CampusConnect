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
import { ClubService } from '../../services/club.service';
import { EventService } from '../../services/event.service';
import { Club, Event } from '../../types/models';
import { getClubImageUrl } from '../../utils/cloudinary';
import { hexToRgba } from '../../utils/colorUtils';

export default function ClubDetailsScreen() {
    const { clubId } = useLocalSearchParams<{ clubId: string }>();
    const [club, setClub] = useState<Club | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const [clubData, eventsData] = await Promise.all([
                ClubService.getClubById(clubId),
                ClubService.getClubEvents(clubId)
            ]);
            setClub(clubData);
            setEvents(eventsData.map((e: any) => EventService.transformEvent(e)));
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
    }, [clubId]);

    const onRefresh = () => {
        fetchData();
    };

    if (loading) {
        return (
            <ScreenWrapper style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.accent.purpleLight} />
            </ScreenWrapper>
        );
    }

    if (!club) {
        return (
            <ScreenWrapper style={styles.loadingContainer}>
                <Text style={styles.errorText}>Club not found</Text>
            </ScreenWrapper>
        );
    }

    const clubImageUrl = club.imageUrl
        ? (club.imageUrl.includes('cloudinary.com') || (!club.imageUrl.includes('http://') && !club.imageUrl.includes('https://')))
            ? getClubImageUrl(club.imageUrl, 320)
            : club.imageUrl
        : null;

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
                        tintColor={Theme.colors.accent.purpleLight} 
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    {/* Club Info Card */}
                    <PremiumGlassCard style={styles.clubCard} intensity={Theme.blur.medium} gradient>
                        <View style={styles.clubInfoContainer}>
                            {/* Club Image - Only show if image exists */}
                            {clubImageUrl && (
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={{ uri: clubImageUrl }}
                                        style={styles.clubImage}
                                        contentFit="cover"
                                    />
                                </View>
                            )}

                            {/* Club Details */}
                            <View style={[styles.clubDetails, !clubImageUrl && styles.clubDetailsFullWidth]}>
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
                            <View style={styles.categoryContainer}>
                                <PillTag 
                                    label={club.category} 
                                    variant="category" 
                                    glow 
                                />
                            </View>
                        )}

                        {/* Open Chat Button */}
                        <TouchableOpacity
                            onPress={() => router.push({
                                pathname: '/(organizer)/club-chat',
                                params: { clubId: clubId }
                            })}
                            style={styles.chatButton}
                            activeOpacity={0.8}
                        >
                            <BlurView intensity={Theme.blur.medium} tint="dark" style={StyleSheet.absoluteFill} />
                            <LinearGradient
                                colors={[
                                    hexToRgba(Theme.colors.accent.purple, 0.4),
                                    hexToRgba(Theme.colors.accent.purpleDark, 0.3),
                                ]}
                                style={StyleSheet.absoluteFill}
                            />
                            <FontAwesome name="comments" size={Theme.typography.fontSize.lg} color={Theme.colors.text.primary} style={{ marginRight: Theme.spacing.sm }} />
                            <Text style={styles.chatButtonText}>Open Chat</Text>
                        </TouchableOpacity>
                    </PremiumGlassCard>

                    {/* Events Section */}
                    <View style={styles.eventsSection}>
                        <SectionTitle 
                            title={`Club Events (${events.length})`}
                        />
                        
                        {events.length > 0 ? (
                            <FlatList
                                data={events}
                                renderItem={({ item }) => (
                                    <View style={styles.eventCardWrapper}>
                                        <EventCard
                                            event={item}
                                            onPress={() => router.push({
                                                pathname: '/(organizer)/event-details',
                                                params: { id: item.id }
                                            })}
                                            showActions={false}
                                        />
                                    </View>
                                )}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                            />
                        ) : (
                            <PremiumGlassCard style={styles.emptyEventsCard} intensity={Theme.blur.light}>
                                <View style={styles.emptyEventsContainer}>
                                    <FontAwesome name="calendar-times-o" size={48} color={Theme.colors.text.disabled} />
                                    <Text style={styles.emptyEventsText}>No events yet</Text>
                                    <Text style={styles.emptyEventsSubtext}>
                                        Events created for this club will appear here
                                    </Text>
                                </View>
                            </PremiumGlassCard>
                        )}
                    </View>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.text.secondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    content: {
        paddingHorizontal: Theme.layout.padding.horizontal,
        paddingTop: Theme.spacing.xl,
    },
    clubCard: {
        marginBottom: Theme.spacing.xxxl,
    },
    clubInfoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Theme.spacing.lg,
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: Theme.radius.xl,
        overflow: 'hidden',
        marginRight: Theme.spacing.lg,
        borderWidth: 2,
        borderColor: hexToRgba(Theme.colors.accent.purple, 0.3),
        ...Theme.shadows.md,
    },
    clubImage: {
        width: '100%',
        height: '100%',
    },
    clubDetails: {
        flex: 1,
    },
    clubDetailsFullWidth: {
        marginLeft: 0,
    },
    clubName: {
        fontSize: Theme.typography.fontSize['2xl'],
        fontWeight: '700',
        color: Theme.colors.text.primary,
        marginBottom: Theme.spacing.sm,
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
        color: Theme.colors.text.tertiary,
        lineHeight: Theme.typography.fontSize.base * Theme.typography.lineHeight.normal,
        marginBottom: Theme.spacing.lg,
    },
    categoryContainer: {
        marginBottom: Theme.spacing.xl,
        alignSelf: 'flex-start',
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Theme.spacing.lg,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: hexToRgba(Theme.colors.accent.purple, 0.5),
        ...Theme.shadows.md,
    },
    chatButtonText: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '700',
        color: Theme.colors.text.primary,
    },
    eventsSection: {
        marginBottom: Theme.spacing.xxxl,
    },
    eventCardWrapper: {
        marginBottom: Theme.spacing.lg,
    },
    emptyEventsCard: {
        paddingVertical: Theme.spacing.xxxl * 1.5,
    },
    emptyEventsContainer: {
        alignItems: 'center',
    },
    emptyEventsText: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '600',
        color: Theme.colors.text.secondary,
        marginTop: Theme.spacing.lg,
    },
    emptyEventsSubtext: {
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.muted,
        marginTop: Theme.spacing.sm,
        textAlign: 'center',
    },
});
