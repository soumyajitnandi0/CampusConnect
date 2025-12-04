import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PremiumGlassCard } from '../../components/ui/PremiumGlassCard';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Theme } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { hexToRgba } from '../../utils/colorUtils';
import { storage } from "../../utils/storage";

export default function ProfileScreen() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await storage.getItem('user');
                if (userData) {
                    setUser(JSON.parse(userData));
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

    const handleLogout = async () => {
        try {
            // Sign out from Supabase if session exists
            await supabase.auth.signOut();

            // Clear local storage
            await storage.removeItem('token');
            await storage.removeItem('user');

            // Navigate to login
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local storage and navigate even if Supabase signout fails
            await storage.removeItem('token');
            await storage.removeItem('user');
            router.replace('/(auth)/login');
        }
    };

    if (loading) {
        return (
            <ScreenWrapper style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.accent.purpleLight} />
            </ScreenWrapper>
        );
    }

    if (!user) {
        return (
            <ScreenWrapper style={styles.loadingContainer}>
                <Text style={styles.errorText}>No user data</Text>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>
                    {/* Profile Header */}
                    <View style={styles.profileHeader}>
                        <PremiumGlassCard style={styles.avatarContainer} intensity={Theme.blur.medium} gradient>
                            <Text style={styles.avatarText}>
                                {user.name.charAt(0).toUpperCase()}
                            </Text>
                        </PremiumGlassCard>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        <View style={styles.roleChip}>
                            <Text style={styles.roleText}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Text>
                        </View>
                    </View>

                    {/* Organizer Dashboard Card */}
                    <PremiumGlassCard style={styles.dashboardCard} intensity={Theme.blur.medium} gradient>
                        <View style={styles.dashboardHeader}>
                            <View style={styles.dashboardIconCircle}>
                                <FontAwesome name="calendar-check-o" size={Theme.typography.fontSize.xl} color={Theme.colors.accent.purpleLight} />
                            </View>
                            <View style={styles.dashboardTextContainer}>
                                <Text style={styles.dashboardTitle}>Organizer Dashboard</Text>
                                <Text style={styles.dashboardDescription}>
                                    Manage your events and track attendance from the dashboard.
                                </Text>
                            </View>
                        </View>
                    </PremiumGlassCard>

                    {/* Logout Button */}
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={styles.logoutButton}
                        activeOpacity={0.8}
                    >
                        <BlurView intensity={Theme.blur.medium} tint="dark" style={StyleSheet.absoluteFill} />
                        <LinearGradient
                            colors={[
                                hexToRgba(Theme.colors.accent.red, 0.2),
                                hexToRgba(Theme.colors.accent.red, 0.1),
                            ]}
                            style={StyleSheet.absoluteFill}
                        />
                        <FontAwesome name="sign-out" size={Theme.typography.fontSize.lg} color={Theme.colors.accent.red} style={{ marginRight: Theme.spacing.sm }} />
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
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
        color: Theme.colors.text.muted,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 120,
    },
    container: {
        paddingHorizontal: Theme.layout.padding.horizontal,
        paddingTop: Theme.spacing.xxxl,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: Theme.spacing.xxxl,
    },
    avatarContainer: {
        width: 112,
        height: 112,
        borderRadius: Theme.radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.spacing.lg,
        padding: 0,
    },
    avatarText: {
        fontSize: Theme.typography.fontSize['3xl'] * 1.5,
        fontWeight: '700',
        color: Theme.colors.text.primary,
    },
    userName: {
        fontSize: Theme.typography.fontSize['2xl'],
        fontWeight: '700',
        color: Theme.colors.text.primary,
        marginBottom: Theme.spacing.xs,
    },
    userEmail: {
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.text.secondary,
        marginBottom: Theme.spacing.sm,
    },
    roleChip: {
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.sm,
        borderRadius: Theme.radius.full,
        backgroundColor: Theme.colors.glass.light,
        borderWidth: 1,
        borderColor: Theme.colors.glass.border,
        marginTop: Theme.spacing.xs,
    },
    roleText: {
        fontSize: Theme.typography.fontSize.sm,
        fontWeight: '600',
        color: Theme.colors.text.primary,
        textTransform: 'capitalize',
    },
    dashboardCard: {
        marginBottom: Theme.spacing.xxxl,
    },
    dashboardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    dashboardIconCircle: {
        width: 48,
        height: 48,
        borderRadius: Theme.radius.full,
        backgroundColor: Theme.colors.glass.light,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Theme.spacing.md,
        borderWidth: 1,
        borderColor: Theme.colors.glass.borderLight,
    },
    dashboardTextContainer: {
        flex: 1,
    },
    dashboardTitle: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '700',
        color: Theme.colors.text.primary,
        marginBottom: Theme.spacing.xs,
    },
    dashboardDescription: {
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.tertiary,
        lineHeight: Theme.typography.fontSize.sm * Theme.typography.lineHeight.normal,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Theme.spacing.lg,
        paddingHorizontal: Theme.spacing.xl,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: hexToRgba(Theme.colors.accent.red, 0.5),
        marginTop: 'auto',
        marginBottom: Theme.spacing.xxxl,
        ...Theme.shadows.sm,
    },
    logoutButtonText: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '700',
        color: Theme.colors.accent.red,
    },
});
