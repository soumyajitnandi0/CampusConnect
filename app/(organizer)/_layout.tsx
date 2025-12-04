import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import GlassTabBarBackground from '../../components/ui/GlassTabBarBackground';
import { Theme } from '../../constants/theme';

function TabBarIcon(props: {
    name: React.ComponentProps<typeof FontAwesome>['name'];
    color: string;
    focused?: boolean;
}) {
    return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function OrganizerLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Theme.colors.text.primary,
                tabBarInactiveTintColor: Theme.colors.text.muted,
                headerShown: false,
                tabBarBackground: () => <GlassTabBarBackground />,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                    height: Platform.OS === 'ios' ? 85 : 65,
                    bottom: 0,
                    left: 0,
                    right: 0,
                },
                tabBarItemStyle: {
                    paddingTop: Platform.OS === 'ios' ? 8 : 4,
                },
                tabBarLabelStyle: {
                    fontSize: Theme.typography.fontSize.xs,
                    fontWeight: '600',
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
                name="clubs"
                options={{
                    title: 'Clubs',
                    tabBarIcon: ({ color }) => <TabBarIcon name="group" color={color} />,
                }}
            />
            <Tabs.Screen
                name="create-event"
                options={{
                    title: 'Create',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon 
                            name="plus-circle" 
                            color={focused ? Theme.colors.accent.purpleLight : color} 
                            focused={focused}
                        />
                    ),
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
                name="create-club"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
            <Tabs.Screen
                name="reschedule-event"
                options={{
                    href: null, // Hide from tab bar
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
            <Tabs.Screen
                name="club-details"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
            <Tabs.Screen
                name="club-chat"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
        </Tabs>
    );
}
