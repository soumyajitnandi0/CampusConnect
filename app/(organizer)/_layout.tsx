import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

function TabBarIcon(props: {
    name: React.ComponentProps<typeof FontAwesome>['name'];
    color: string;
}) {
    return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function OrganizerLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#2563eb', // blue-600
                headerShown: false,
                tabBarStyle: Platform.select({
                    ios: {
                        position: 'absolute',
                    },
                    default: {},
                }),
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => <TabBarIcon name="dashboard" color={color} />,
                }}
            />
            <Tabs.Screen
                name="create-event"
                options={{
                    title: 'Create',
                    tabBarIcon: ({ color }) => <TabBarIcon name="plus-square" color={color} />,
                }}
            />
            <Tabs.Screen
                name="scanner"
                options={{
                    title: 'Scanner',
                    tabBarIcon: ({ color }) => <TabBarIcon name="qrcode" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
                }}
            />
            <Tabs.Screen
                name="event-details"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
        </Tabs>
    );
}
