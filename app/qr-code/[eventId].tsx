import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { QRCodeDisplay } from '../../components/qr-code-display';
import { PremiumGlassCard } from '../../components/ui/PremiumGlassCard';
import { PremiumHeader } from '../../components/ui/PremiumHeader';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../contexts/auth.context';
import { useEvents } from '../../contexts/events.context';
import { hexToRgba } from '../../utils/colorUtils';

export default function QRCodeScreen() {
    const router = useRouter();
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const { user } = useAuth();
    const { events } = useEvents();

    const event = events.find(e => e.id === eventId);

    if (!user) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <Stack.Screen options={{ title: 'Event Ticket', headerTransparent: true, headerTintColor: 'white' }} />
                <Text style={styles.errorText}>Please login to view QR code</Text>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <Stack.Screen options={{ headerShown: false }} />
            <PremiumHeader title="Event Ticket" />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>
                    {/* Main QR Card */}
                    <PremiumGlassCard intensity={25} gradient style={styles.mainCard}>
                        {/* Header Icon */}
                        <View style={styles.iconContainer}>
                            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                            <LinearGradient
                                colors={[hexToRgba(Theme.colors.accent.blue, 0.4), hexToRgba(Theme.colors.accent.blue, 0.2)]}
                                style={StyleSheet.absoluteFill}
                            />
                            <FontAwesome name="qrcode" size={32} color={Theme.colors.accent.blue} />
                        </View>

                        {/* Event Title */}
                        <Text style={styles.eventTitle} numberOfLines={2}>
                            {event?.title || 'Event Check-In'}
                        </Text>
                        <Text style={styles.subtitle}>
                            Show this QR code at the event entrance
                        </Text>

                        {/* QR Code Container */}
                        <View style={styles.qrContainer}>
                            <View style={styles.qrCard}>
                                <QRCodeDisplay
                                    userId={user.id}
                                    eventId={eventId}
                                    size={220}
                                    showLabel={false}
                                />
                            </View>
                        </View>

                        {/* User Details Card */}
                        <PremiumGlassCard intensity={15} style={styles.detailsCard}>
                            <View style={styles.detailRow}>
                                <View style={styles.detailIcon}>
                                    <FontAwesome name="user" size={18} color={Theme.colors.accent.blue} />
                                </View>
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Name</Text>
                                    <Text style={styles.detailValue}>{user.name}</Text>
                                </View>
                            </View>
                            {user.role === 'student' && user.rollNo && (
                                <>
                                    <View style={styles.detailDivider} />
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailIcon}>
                                            <FontAwesome name="id-card" size={18} color={Theme.colors.accent.blue} />
                                        </View>
                                        <View style={styles.detailContent}>
                                            <Text style={styles.detailLabel}>Roll Number</Text>
                                            <Text style={styles.detailValue}>{user.rollNo}</Text>
                                        </View>
                                    </View>
                                </>
                            )}
                        </PremiumGlassCard>
                    </PremiumGlassCard>

                    {/* Done Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.doneButton}
                        activeOpacity={0.8}
                    >
                        <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                            <LinearGradient
                                colors={[hexToRgba(Theme.colors.text.primary, 0.2), hexToRgba(Theme.colors.text.primary, 0.1)]}
                                style={StyleSheet.absoluteFill}
                            />
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Theme.layout.padding.horizontal,
        paddingTop: Theme.spacing.xl,
        paddingBottom: 120,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        maxWidth: 500,
        alignSelf: 'center',
        width: '100%',
    },
    mainCard: {
        width: '100%',
        alignItems: 'center',
        marginBottom: Theme.spacing.xl,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Theme.spacing.lg,
        borderWidth: 1,
        borderColor: hexToRgba(Theme.colors.accent.blue, 0.5),
        ...Theme.shadows.md,
    },
    eventTitle: {
        fontSize: Theme.typography.fontSize['2xl'],
        fontWeight: '700',
        color: Theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: Theme.spacing.sm,
        paddingHorizontal: Theme.spacing.md,
    },
    subtitle: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '500',
        color: Theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: Theme.spacing.xl,
        paddingHorizontal: Theme.spacing.md,
    },
    qrContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: Theme.spacing.xl,
    },
    qrCard: {
        backgroundColor: Theme.colors.text.primary,
        borderRadius: Theme.radius.xl,
        padding: Theme.spacing.lg,
        ...Theme.shadows.lg,
    },
    detailsCard: {
        width: '100%',
        padding: Theme.spacing.lg,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        width: 40,
        height: 40,
        borderRadius: Theme.radius.md,
        backgroundColor: hexToRgba(Theme.colors.accent.blue, 0.2),
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
    },
    detailDivider: {
        height: 1,
        backgroundColor: Theme.colors.glass.borderLight,
        marginVertical: Theme.spacing.md,
    },
    doneButton: {
        width: '100%',
        height: 56,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Theme.colors.glass.border,
        ...Theme.shadows.md,
    },
    doneButtonText: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '700',
        color: Theme.colors.text.primary,
    },
    errorText: {
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.text.muted,
    },
});
