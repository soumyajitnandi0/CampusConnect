import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Theme } from '../../constants/theme';
import api from '../../services/api';
import { EventService } from '../../services/event.service';
import { supabase } from '../../services/supabase';
import { Event } from '../../types/models';
import { hexToRgba } from '../../utils/colorUtils';
import { formatEventDate, isEventPast } from '../../utils/event.utils';
import { storage } from "../../utils/storage";

export default function ProfileScreen() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [upcomingRSVPs, setUpcomingRSVPs] = useState<Event[]>([]);
    const [loadingRSVPs, setLoadingRSVPs] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await storage.getItem('user');
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                    
                    if (parsedUser.role === 'student' && parsedUser.id) {
                        loadUpcomingRSVPs(parsedUser.id);
                    }
                } else {
                    router.replace('/(auth)/login');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, [router]);

    const loadUpcomingRSVPs = async (userId: string) => {
        try {
            setLoadingRSVPs(true);
            const token = await storage.getItem('token');
            if (!token) {
                setLoadingRSVPs(false);
                return;
            }

            const response = await api.get(`/rsvps/user/${userId}`, {
                headers: {
                    'x-auth-token': token,
                },
            });

            const rsvpsData = response.data;
            
            const upcomingEvents = rsvpsData
                .filter((rsvp: any) => rsvp.status === 'going' && rsvp.event)
                .map((rsvp: any) => {
                    const eventData = rsvp.event;
                    return EventService.transformEvent({
                        ...eventData,
                        rsvps: [],
                        checkedIn: [],
                    });
                })
                .filter((event: Event) => !isEventPast(event))
                .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5);
            
            setUpcomingRSVPs(upcomingEvents);
        } catch (error) {
            console.error('Error loading upcoming RSVPs:', error);
        } finally {
            setLoadingRSVPs(false);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            await storage.removeItem('token');
            await storage.removeItem('user');
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Logout error:', error);
            await storage.removeItem('token');
            await storage.removeItem('user');
            router.replace('/(auth)/login');
        }
    };

    if (loading) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color={Theme.colors.text.primary} />
            </ScreenWrapper>
        );
    }

    if (!user) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <Text style={styles.errorText}>No user data</Text>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
            >
                <View style={styles.content}>
                    {/* Profile Header */}
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                                <LinearGradient
                                    colors={[hexToRgba(Theme.colors.accent.purple, 0.3), hexToRgba(Theme.colors.accent.blue, 0.2)]}
                                    style={StyleSheet.absoluteFill}
                                />
                                <Text style={styles.avatarText}>
                                    {user.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.statusIndicator} />
                        </View>

                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>

                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>
                                {user.role.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {/* Academic Details Card */}
                    {user.role === 'student' && user.rollNo && (
                        <View style={styles.card}>
                            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderIcon}>
                                    <FontAwesome name="graduation-cap" size={20} color={Theme.colors.accent.blue} />
                                </View>
                                <View style={styles.cardHeaderText}>
                                    <Text style={styles.cardTitle}>Academic Details</Text>
                                    <Text style={styles.cardSubtitle}>Student Information</Text>
                                </View>
                            </View>

                            <View style={styles.cardContent}>
                                <View style={styles.detailRow}>
                                    <View style={styles.detailLeft}>
                                        <FontAwesome name="id-card" size={16} color={Theme.colors.text.muted} />
                                        <Text style={styles.detailLabel}>Roll Number</Text>
                                    </View>
                                    <Text style={styles.detailValue}>
                                        {user.rollNo || 'Not set'}
                                    </Text>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.detailRow}>
                                    <View style={styles.detailLeft}>
                                        <FontAwesome name="calendar" size={16} color={Theme.colors.text.muted} />
                                        <Text style={styles.detailLabel}>Year & Section</Text>
                                    </View>
                                    <Text style={styles.detailValue}>
                                        {user.yearSection || 'Not set'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Upcoming RSVPs Section */}
                    {user.role === 'student' && (
                        <View style={styles.card}>
                            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <View style={[styles.cardHeaderIcon, { backgroundColor: Theme.colors.accent.purple + '20' }]}>
                                        <FontAwesome name="calendar-check-o" size={20} color={Theme.colors.accent.purpleLight} />
                                    </View>
                                    <View style={styles.cardHeaderText}>
                                        <Text style={styles.cardTitle}>Upcoming RSVPs</Text>
                                        <Text style={styles.cardSubtitle}>Events you're attending</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => user && user.id && loadUpcomingRSVPs(user.id)}
                                    disabled={loadingRSVPs}
                                    style={styles.refreshButton}
                                    activeOpacity={0.7}
                                >
                                    {loadingRSVPs ? (
                                        <ActivityIndicator size="small" color={Theme.colors.accent.purpleLight} />
                                    ) : (
                                        <FontAwesome name="refresh" size={16} color={Theme.colors.accent.purpleLight} />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.cardContent}>
                                {loadingRSVPs ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color={Theme.colors.accent.purpleLight} />
                                        <Text style={styles.loadingText}>Loading events...</Text>
                                    </View>
                                ) : upcomingRSVPs.length > 0 ? (
                                    <View style={styles.rsvpList}>
                                        {upcomingRSVPs.map((event) => (
                                            <View key={event.id} style={styles.rsvpCard}>
                                                <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                                                <View style={styles.rsvpContent}>
                                                    <TouchableOpacity
                                                        onPress={() => router.push({
                                                            pathname: '/event/[id]',
                                                            params: { id: event.id }
                                                        })}
                                                        style={styles.rsvpInfo}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text style={styles.rsvpTitle} numberOfLines={2}>
                                                            {event.title}
                                                        </Text>
                                                        <View style={styles.rsvpDetails}>
                                                            <View style={styles.rsvpDetailRow}>
                                                                <FontAwesome name="calendar" size={11} color={Theme.colors.text.muted} />
                                                                <Text style={styles.rsvpDetailText}>
                                                                    {formatEventDate(event.date)}
                                                                </Text>
                                                            </View>
                                                            {event.location && (
                                                                <View style={styles.rsvpDetailRow}>
                                                                    <FontAwesome name="map-marker" size={11} color={Theme.colors.text.muted} />
                                                                    <Text style={styles.rsvpDetailText} numberOfLines={1}>
                                                                        {event.location}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => router.push({
                                                            pathname: '/qr-code/[eventId]',
                                                            params: { eventId: event.id }
                                                        })}
                                                        style={styles.qrButton}
                                                        activeOpacity={0.7}
                                                    >
                                                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                                        <LinearGradient
                                                            colors={[hexToRgba(Theme.colors.accent.blue, 0.3), hexToRgba(Theme.colors.accent.blue, 0.1)]}
                                                            style={StyleSheet.absoluteFill}
                                                        />
                                                        <FontAwesome name="qrcode" size={20} color={Theme.colors.accent.blue} />
                                                        <Text style={styles.qrButtonText}>QR</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <View style={styles.emptyRSVP}>
                                        <FontAwesome name="calendar-times-o" size={40} color={Theme.colors.text.disabled} />
                                        <Text style={styles.emptyRSVPText}>No upcoming events</Text>
                                        <Text style={styles.emptyRSVPSubtext}>
                                            RSVP to events to see them here
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Logout Button */}
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                        <LinearGradient
                            colors={[hexToRgba(Theme.colors.accent.red, 0.2), hexToRgba(Theme.colors.accent.red, 0.1)]}
                            style={StyleSheet.absoluteFill}
                        />
                        <FontAwesome name="sign-out" size={18} color={Theme.colors.accent.red} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
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
        paddingTop: Theme.spacing.xxxl,
        maxWidth: 500,
        alignSelf: 'center',
        width: '100%',
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: Theme.spacing.xxxl,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: Theme.spacing.lg,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: Theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Theme.colors.glass.border,
        overflow: 'hidden',
        ...Theme.shadows.lg,
    },
    avatarText: {
        fontSize: 48,
        fontWeight: '700',
        color: Theme.colors.text.primary,
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: Theme.radius.full,
        backgroundColor: Theme.colors.accent.green,
        borderWidth: 4,
        borderColor: Theme.colors.background.primary,
    },
    userName: {
        fontSize: Theme.typography.fontSize['3xl'],
        fontWeight: '700',
        color: Theme.colors.text.primary,
        marginBottom: Theme.spacing.xs,
        textAlign: 'center',
    },
    userEmail: {
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.text.muted,
        marginBottom: Theme.spacing.md,
        textAlign: 'center',
    },
    roleBadge: {
        paddingHorizontal: Theme.spacing.xl,
        paddingVertical: Theme.spacing.sm,
        borderRadius: Theme.radius.full,
        backgroundColor: Theme.colors.glass.medium,
        borderWidth: 1,
        borderColor: Theme.colors.glass.border,
    },
    roleText: {
        fontSize: Theme.typography.fontSize.sm,
        fontWeight: '700',
        color: Theme.colors.text.primary,
        letterSpacing: 1,
    },
    card: {
        borderRadius: Theme.radius.xl,
        overflow: 'hidden',
        backgroundColor: Theme.colors.glass.medium,
        borderWidth: 1,
        borderColor: Theme.colors.glass.border,
        marginBottom: Theme.spacing.xl,
        ...Theme.shadows.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Theme.layout.cardPadding.vertical,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.glass.borderLight,
        backgroundColor: Theme.colors.glass.dark,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardHeaderIcon: {
        width: 40,
        height: 40,
        borderRadius: Theme.radius.md,
        backgroundColor: Theme.colors.accent.blue + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Theme.spacing.md,
    },
    cardHeaderText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '700',
        color: Theme.colors.text.primary,
        marginBottom: Theme.spacing.xs,
    },
    cardSubtitle: {
        fontSize: Theme.typography.fontSize.xs,
        color: Theme.colors.text.muted,
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: Theme.radius.md,
        backgroundColor: Theme.colors.accent.purple + '20',
        borderWidth: 1,
        borderColor: Theme.colors.accent.purple + '40',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        padding: Theme.layout.cardPadding.vertical,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Theme.spacing.lg,
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.sm,
    },
    detailLabel: {
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.text.tertiary,
    },
    detailValue: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '700',
        color: Theme.colors.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: Theme.colors.glass.borderLight,
        marginBottom: Theme.spacing.lg,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xxl,
    },
    loadingText: {
        marginTop: Theme.spacing.md,
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.muted,
    },
    rsvpList: {
        gap: Theme.spacing.md,
    },
    rsvpCard: {
        borderRadius: Theme.radius.lg,
        overflow: 'hidden',
        backgroundColor: Theme.colors.glass.dark,
        borderWidth: 1,
        borderColor: Theme.colors.glass.borderLight,
    },
    rsvpContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.md,
    },
    rsvpInfo: {
        flex: 1,
        marginRight: Theme.spacing.md,
    },
    rsvpTitle: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '700',
        color: Theme.colors.text.primary,
        marginBottom: Theme.spacing.sm,
    },
    rsvpDetails: {
        gap: Theme.spacing.xs,
    },
    rsvpDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.xs,
    },
    rsvpDetailText: {
        flex: 1,
        fontSize: Theme.typography.fontSize.xs,
        color: Theme.colors.text.muted,
    },
    qrButton: {
        width: 60,
        height: 60,
        borderRadius: Theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Theme.colors.accent.blue + '50',
        overflow: 'hidden',
    },
    qrButtonText: {
        fontSize: Theme.typography.fontSize.xs,
        fontWeight: '700',
        color: Theme.colors.accent.blue,
        marginTop: 2,
    },
    emptyRSVP: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xxl,
    },
    emptyRSVPText: {
        marginTop: Theme.spacing.md,
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.secondary,
    },
    emptyRSVPSubtext: {
        marginTop: Theme.spacing.xs,
        fontSize: Theme.typography.fontSize.xs,
        color: Theme.colors.text.muted,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Theme.spacing.lg,
        borderRadius: Theme.radius.xl,
        borderWidth: 1,
        borderColor: Theme.colors.accent.red + '50',
        marginTop: Theme.spacing.md,
        marginBottom: Theme.spacing.xl,
        overflow: 'hidden',
        gap: Theme.spacing.sm,
    },
    logoutText: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '700',
        color: Theme.colors.accent.red,
    },
    errorText: {
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.text.muted,
    },
});
