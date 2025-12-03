import FontAwesome from '@expo/vector-icons/FontAwesome';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { GlassContainer } from './GlassContainer';

export const WebSidebar = () => {
    const router = useRouter();
    const pathname = usePathname();

    const menuItems = [
        { name: 'Home', icon: 'home', route: '/(student)' },
        { name: 'My Events', icon: 'calendar', route: '/(student)/my-events' },
        { name: 'Explore', icon: 'search', route: '/(student)/explore' },
        { name: 'Profile', icon: 'user', route: '/(student)/profile' },
    ];

    return (
        <View className="w-64 h-full p-4 bg-black border-r border-white/10">
            <View className="mb-8 px-4">
                <Text className="text-white text-2xl font-bold">CampusConnect</Text>
            </View>

            <View className="space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.route || (item.route !== '/(student)' && pathname.startsWith(item.route));
                    return (
                        <TouchableOpacity
                            key={item.name}
                            onPress={() => router.push(item.route as any)}
                        >
                            <GlassContainer
                                className={`flex-row items-center p-4 rounded-xl border-0 ${isActive ? 'bg-white/10' : 'bg-transparent'}`}
                                intensity={isActive ? 20 : 0}
                                contentClassName="flex-row items-center p-0"
                            >
                                <View className="w-8 items-center">
                                    <FontAwesome
                                        name={item.icon as any}
                                        size={20}
                                        color={isActive ? '#FFFFFF' : '#9CA3AF'}
                                    />
                                </View>
                                <Text className={`ml-3 font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                    {item.name}
                                </Text>
                            </GlassContainer>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};
