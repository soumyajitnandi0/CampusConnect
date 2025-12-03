import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import GlassTabBarBackground from '../../components/ui/GlassTabBarBackground';
import { WebSidebar } from '../../components/ui/WebSidebar';

function TabBarIcon(props: {
    name: React.ComponentProps<typeof FontAwesome>['name'];
    color: string;
}) {
    return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
    const isWeb = Platform.OS === 'web';

    return (
        <View style={{ flex: 1, flexDirection: 'row' }}>
            {isWeb && <WebSidebar />}
            <View style={{ flex: 1 }}>
                <Tabs
                    screenOptions={{
                        tabBarActiveTintColor: '#FFFFFF',
                        tabBarInactiveTintColor: '#9CA3AF',
                        headerShown: false,
                        tabBarBackground: () => <GlassTabBarBackground />,
                        tabBarStyle: isWeb ? { display: 'none' } : Platform.select({
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
                            title: 'Home',
                            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="my-events"
                        options={{
                            title: 'My Events',
                            tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="explore"
                        options={{
                            title: 'Explore',
                            tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="scan"
                        options={{
                            href: null, // Hide from tab bar
                        }}
                    />
                    <Tabs.Screen
                        name="feedback"
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
                </Tabs>
            </View>
        </View>
    );
}
