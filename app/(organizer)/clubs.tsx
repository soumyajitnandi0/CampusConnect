import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { OrganizerClubCard } from '../../components/ui/OrganizerClubCard';
import { OrganizerHeaderCard } from '../../components/ui/OrganizerHeaderCard';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Theme } from '../../constants/theme';
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
        <OrganizerClubCard
            club={item}
            onPress={() => router.push({
                pathname: '/(organizer)/club-details',
                params: { clubId: item.id }
            })}
        />
    );

    if (loading) {
        return (
            <ScreenWrapper style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.accent.purpleLight} />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <OrganizerHeaderCard
                title="My Clubs"
                subtitle="Manage your clubs"
                icon="group"
                rightAction={{
                    icon: 'plus',
                    onPress: () => router.push('/(organizer)/create-club'),
                }}
            />

            <FlatList
                data={clubs}
                renderItem={renderClub}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Theme.colors.accent.purpleLight}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="group" size={48} color={Theme.colors.text.disabled} />
                        <Text style={styles.emptyTitle}>
                            No clubs created yet
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            Create your first club to organize events!
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 120,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: Theme.spacing.xxxl * 2,
        paddingHorizontal: Theme.layout.padding.horizontal,
    },
    emptyTitle: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '600',
        color: Theme.colors.text.secondary,
        marginTop: Theme.spacing.lg,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.muted,
        marginTop: Theme.spacing.sm,
        textAlign: 'center',
    },
});


