import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PillTag } from '../../components/ui/PillTag';
import { PremiumGlassCard } from '../../components/ui/PremiumGlassCard';
import { PremiumHeader } from '../../components/ui/PremiumHeader';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../contexts/auth.context';
import { useEvents } from '../../contexts/events.context';
import { EventService } from '../../services/event.service';
import { Event } from '../../types/models';
import { getEventDetailImageUrl } from '../../utils/cloudinary';
import { hexToRgba } from '../../utils/colorUtils';
import { formatEventDate, isEventPast } from '../../utils/event.utils';

export default function EventDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { rsvpForEvent, cancelRSVP, isUserRSVPd, refreshEvents } = useEvents();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rsvping, setRsvping] = useState(false);

    const fetchEventDetails = async () => {
        try {
            const eventData = await EventService.getEventById(id);
            setEvent(eventData);
        } catch (error: any) {
            console.error('Error fetching event:', error);
            Alert.alert('Error', error.message || 'Failed to load event details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchEventDetails();
        }
    }, [id]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchEventDetails();
        await refreshEvents();
    };

    const handleRSVP = async () => {
        if (!event || !user) {
            Alert.alert('Error', 'Please log in to RSVP for events');
            return;
        }

        if (event.status === 'canceled') {
            Alert.alert('Event Canceled', 'This event has been canceled. You cannot RSVP to canceled events.');
            return;
        }

        const isPast = isEventPast(event);
        if (isPast) {
            Alert.alert('Event Ended', 'You cannot RSVP to past events.');
            return;
        }

        try {
            setRsvping(true);
            const rsvpsArray = event.rsvps || [];
            const userId = user.id || user._id;
            const isAlreadyRSVPd = rsvpsArray.some((rsvpId: string) => 
                rsvpId?.toString() === userId?.toString()
            );

            if (isAlreadyRSVPd) {
                await cancelRSVP(event.id);
            } else {
                await rsvpForEvent(event.id);
            }
            await fetchEventDetails();
            await refreshEvents();
        } catch (error: any) {
            console.error('RSVP error:', error);
            const errorMessage = error.response?.data?.msg || error.message || 'Failed to update RSVP';
            Alert.alert('Error', errorMessage);
        } finally {
            setRsvping(false);
        }
    };

    if (loading) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color={Theme.colors.text.primary} />
            </ScreenWrapper>
        );
    }

    if (!event) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <FontAwesome name="exclamation-circle" size={48} color={Theme.colors.text.disabled} />
                <Text style={styles.errorText}>Event not found</Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.errorButton}
                >
                    <Text style={styles.errorButtonText}>Go Back</Text>
                </TouchableOpacity>
            </ScreenWrapper>
        );
    }

    const isPast = isEventPast(event);
    const isCanceled = event?.status === 'canceled';
    const isRescheduled = event?.status === 'rescheduled';
    const rsvpsArray = event?.rsvps || [];
    const userId = user?.id || user?._id;
    const isRSVPd = user && rsvpsArray.length > 0 ? rsvpsArray.some((rsvpId: string) => 
        rsvpId?.toString() === userId?.toString()
    ) : false;
    const canRSVP = !isPast && !isCanceled;

    return (
        <ScreenWrapper>
            <PremiumHeader title="Event Details" />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor={Theme.colors.text.primary} 
                    />
                }
            >
                {/* Header Image - Only show if image exists */}
                {event.imageUrl && event.imageUrl.trim() !== '' && (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ 
                                uri: (event.imageUrl.includes('cloudinary.com') || (!event.imageUrl.includes('http://') && !event.imageUrl.includes('https://')))
                                    ? getEventDetailImageUrl(event.imageUrl, 1200)
                                    : event.imageUrl.trim()
                            }}
                            style={styles.image}
                            contentFit="cover"
                            transition={300}
                            placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
                        />
                        <LinearGradient
                            colors={['transparent', hexToRgba(Theme.colors.background.primary, 0.7)]}
                            style={styles.imageOverlay}
                        />
                    </View>
                )}

                {/* Main Content */}
                <View style={styles.content}>
                    {/* Premium Glass Card */}
                    <PremiumGlassCard intensity={25} gradient>
                        {/* Title & Badge */}
                        <View style={styles.titleRow}>
                            <Text style={styles.title} numberOfLines={3}>
                                {event.title}
                            </Text>
                            <View style={styles.badgeContainer}>
                                {isCanceled ? (
                                    <PillTag label="Canceled" variant="canceled" glow />
                                ) : isRescheduled ? (
                                    <PillTag label="Rescheduled" variant="rescheduled" />
                                ) : isPast ? (
                                    <PillTag label="Ended" variant="ended" />
                                ) : (
                                    <PillTag label="Upcoming" variant="upcoming" glow />
                                )}
                            </View>
                        </View>

                        {/* Rescheduled Notice */}
                        {isRescheduled && event.rescheduledDate && (
                            <View style={styles.rescheduledNotice}>
                                <FontAwesome name="calendar" size={16} color={Theme.colors.accent.orange} />
                                <Text style={styles.rescheduledText}>
                                    New Date: {formatEventDate(event.rescheduledDate)}
                                </Text>
                            </View>
                        )}

                        {/* Date & Location Section */}
                        <PremiumGlassCard intensity={15} style={styles.detailsCard}>
                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}>
                                    <FontAwesome name="calendar" size={20} color={Theme.colors.accent.blue} />
                                </View>
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>
                                        {isRescheduled ? 'Original Date & Time' : 'Date & Time'}
                                    </Text>
                                    <Text style={styles.detailValue}>
                                        {formatEventDate(event.date)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}>
                                    <FontAwesome name="map-marker" size={20} color={Theme.colors.accent.red} />
                                </View>
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Location</Text>
                                    <Text style={styles.detailValue} numberOfLines={2}>
                                        {event.location}
                                    </Text>
                                </View>
                            </View>
                        </PremiumGlassCard>

                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            <PremiumGlassCard intensity={15} style={styles.statCard}>
                                <FontAwesome name="users" size={24} color={Theme.colors.accent.blue} />
                                <Text style={styles.statValue}>{event.rsvpCount || 0}</Text>
                                <Text style={styles.statLabel}>Attending</Text>
                            </PremiumGlassCard>
                            {event.category && (
                                <PremiumGlassCard intensity={15} style={styles.statCard}>
                                    <FontAwesome name="tag" size={24} color={Theme.colors.accent.purple} />
                                    <Text style={styles.statValue} numberOfLines={1}>
                                        {event.category}
                                    </Text>
                                    <Text style={styles.statLabel}>Category</Text>
                                </PremiumGlassCard>
                            )}
                        </View>

                        {/* About Event */}
                        <View style={styles.aboutSection}>
                            <Text style={styles.aboutTitle}>About Event</Text>
                            <Text style={styles.aboutText}>
                                {event.description}
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        {user && canRSVP && (
                            <TouchableOpacity
                                onPress={handleRSVP}
                                disabled={rsvping}
                                style={styles.rsvpButton}
                                activeOpacity={0.8}
                            >
                                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                <LinearGradient
                                    colors={isRSVPd 
                                        ? ['#1F2937', '#111827'] 
                                        : [Theme.colors.accent.blue, Theme.colors.accent.blueLight]
                                    }
                                    style={StyleSheet.absoluteFill}
                                />
                                {rsvping ? (
                                    <ActivityIndicator size="small" color={Theme.colors.text.primary} />
                                ) : (
                                    <Text style={styles.rsvpButtonText}>
                                        {isRSVPd ? 'Cancel RSVP' : 'RSVP Now'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {isPast && isRSVPd && (
                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: '/(student)/feedback',
                                    params: { eventId: event.id, eventTitle: event.title }
                                })}
                                style={styles.feedbackButton}
                                activeOpacity={0.8}
                            >
                                <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                                <LinearGradient
                                    colors={[hexToRgba(Theme.colors.accent.purple, 0.3), hexToRgba(Theme.colors.accent.purple, 0.1)]}
                                    style={StyleSheet.absoluteFill}
                                />
                                <FontAwesome name="star" size={20} color={Theme.colors.accent.purpleLight} />
                                <Text style={styles.feedbackButtonText}>Rate & Review</Text>
                            </TouchableOpacity>
                        )}

                        {!user && (
                            <View style={styles.loginPrompt}>
                                <Text style={styles.loginPromptText}>
                                    Sign in to RSVP and join this event
                                </Text>
                            </View>
                        )}
                    </PremiumGlassCard>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    imageContainer: {
        width: '100%',
        height: 320,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
    },
    content: {
        paddingHorizontal: Theme.layout.padding.horizontal,
        paddingTop: Theme.spacing.xxl,
        paddingBottom: 120,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Theme.spacing.xl,
        gap: Theme.spacing.md,
    },
    title: {
        flex: 1,
        fontSize: Theme.typography.fontSize['3xl'],
        fontWeight: '700',
        color: Theme.colors.text.primary,
        lineHeight: Theme.typography.fontSize['3xl'] * Theme.typography.lineHeight.tight,
        marginRight: Theme.spacing.sm,
    },
    badgeContainer: {
        marginTop: Theme.spacing.xs,
        flexShrink: 0,
    },
    rescheduledNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: hexToRgba(Theme.colors.accent.orange, 0.2),
        borderWidth: 1,
        borderColor: hexToRgba(Theme.colors.accent.orange, 0.5),
        borderRadius: Theme.radius.md,
        padding: Theme.spacing.md,
        marginBottom: Theme.spacing.lg,
        gap: Theme.spacing.sm,
    },
    rescheduledText: {
        flex: 1,
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.accent.orange,
        fontWeight: '600',
    },
    detailsCard: {
        marginBottom: Theme.spacing.xl,
        padding: Theme.spacing.lg,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Theme.spacing.lg,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: Theme.radius.md,
        backgroundColor: Theme.colors.glass.dark,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Theme.spacing.md,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: Theme.typography.fontSize.xs,
        fontWeight: '600',
        color: Theme.colors.text.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Theme.spacing.xs,
    },
    detailValue: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '600',
        color: Theme.colors.text.primary,
        lineHeight: Theme.typography.fontSize.base * Theme.typography.lineHeight.normal,
    },
    divider: {
        height: 1,
        backgroundColor: Theme.colors.glass.borderLight,
        marginBottom: Theme.spacing.lg,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: Theme.spacing.md,
        marginBottom: Theme.spacing.xl,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Theme.spacing.lg,
    },
    statValue: {
        fontSize: Theme.typography.fontSize['2xl'],
        fontWeight: '700',
        color: Theme.colors.text.primary,
        marginTop: Theme.spacing.md,
        marginBottom: Theme.spacing.xs,
    },
    statLabel: {
        fontSize: Theme.typography.fontSize.xs,
        fontWeight: '600',
        color: Theme.colors.text.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    aboutSection: {
        marginBottom: Theme.spacing.xl,
    },
    aboutTitle: {
        fontSize: Theme.typography.fontSize.xl,
        fontWeight: '700',
        color: Theme.colors.text.primary,
        marginBottom: Theme.spacing.md,
    },
    aboutText: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '500',
        color: Theme.colors.text.secondary,
        lineHeight: Theme.typography.fontSize.base * Theme.typography.lineHeight.relaxed,
    },
    rsvpButton: {
        height: 56,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Theme.spacing.md,
        ...Theme.shadows.md,
    },
    rsvpButtonText: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '700',
        color: Theme.colors.text.primary,
    },
    feedbackButton: {
        height: 56,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Theme.spacing.sm,
        borderWidth: 1,
        borderColor: hexToRgba(Theme.colors.accent.purple, 0.5),
        marginBottom: Theme.spacing.md,
    },
    feedbackButtonText: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '700',
        color: Theme.colors.accent.purpleLight,
    },
    loginPrompt: {
        padding: Theme.spacing.lg,
        backgroundColor: hexToRgba(Theme.colors.accent.blue, 0.2),
        borderWidth: 1,
        borderColor: hexToRgba(Theme.colors.accent.blue, 0.5),
        borderRadius: Theme.radius.xl,
        alignItems: 'center',
    },
    loginPromptText: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '500',
        color: Theme.colors.accent.blue,
        textAlign: 'center',
    },
    errorText: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '600',
        color: Theme.colors.text.muted,
        marginTop: Theme.spacing.lg,
        textAlign: 'center',
    },
    errorButton: {
        marginTop: Theme.spacing.xl,
        paddingHorizontal: Theme.spacing.xl,
        paddingVertical: Theme.spacing.md,
        borderRadius: Theme.radius.full,
        backgroundColor: Theme.colors.accent.blue,
    },
    errorButtonText: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '700',
        color: Theme.colors.text.primary,
    },
});
