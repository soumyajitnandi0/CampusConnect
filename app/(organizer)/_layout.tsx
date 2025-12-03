import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import GlassTabBarBackground from '../../components/ui/GlassTabBarBackground';

function TabBarIcon(props: {
    name: React.ComponentProps<typeof FontAwesome>['name'];
    color: string;
}) {
    return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function OrganizerLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: '#9CA3AF',
                headerShown: false,
                tabBarBackground: () => <GlassTabBarBackground />,
                tabBarStyle: Platform.select({
                    ios: {
                        position: 'absolute',
                        backgroundColor: 'transparent',
                        borderTopWidth: 0,
                        elevation: 0,
                        height: 85,
                    },
                    default: {
                        position: 'absolute',
                        backgroundColor: 'transparent',
                        borderTopWidth: 0,
                        elevation: 0,
                        height: 65,
                        bottom: 0,
                        left: 0,
                        right: 0,
                    },
                }),
                tabBarItemStyle: {
                    paddingTop: 8,
                },
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
