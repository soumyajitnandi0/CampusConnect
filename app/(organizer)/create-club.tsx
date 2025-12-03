import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { GlassInput } from '../../components/ui/GlassInput';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { ClubService } from '../../services/club.service';
import { storage } from "../../utils/storage";

export default function CreateClub() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleCreate = async () => {
        if (!name || !description) {
            Alert.alert('Error', 'Please fill in name and description');
            return;
        }

        try {
            setLoading(true);
            const token = await storage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Not authorized');
                setLoading(false);
                return;
            }

            const cleanImageUrl = imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : undefined;

            await ClubService.createClub({
                name,
                description,
                imageUrl: cleanImageUrl,
                category: category || undefined
            });

            Alert.alert('Success', 'Club created successfully', [
                {
                    text: 'OK',
                    onPress: () => router.back()
                }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to create club');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 20 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <LinearGradient
                        colors={['#1A202C', '#2D3748']}
                        className="px-6 pt-16 pb-4 flex-row justify-between items-center shadow-lg"
                    >
                        <View className="flex-row items-center">
                            <GlassContainer className="w-12 h-12 rounded-full items-center justify-center mr-3 p-0" intensity={30}>
                                <FontAwesome name="group" size={24} color="#FFFFFF" />
                            </GlassContainer>
                            <View>
                                <Text className="text-2xl font-bold text-white">Create Club</Text>
                                <Text className="text-gray-300 text-sm mt-1">Start a new club</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full items-center justify-center bg-white/10 border border-white/20"
                        >
                            <FontAwesome name="close" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </LinearGradient>

                    <View className="px-6 pt-6">
                        {/* Image Placeholder */}
                        <GlassContainer className="h-48 rounded-2xl mb-6 justify-center items-center border border-dashed border-white/30 p-0 relative overflow-hidden" intensity={10}>
                            {imageUrl && imageUrl.trim() !== '' ? (
                                <>
                                    <Image
                                        source={{ uri: imageUrl.trim() }}
                                        style={{ width: '100%', height: '100%', borderRadius: 16 }}
                                        contentFit="cover"
                                        transition={200}
                                    />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                                        className="absolute bottom-0 left-0 right-0 h-20 justify-end p-4"
                                    >
                                        <Text className="text-white text-xl font-bold" numberOfLines={1}>
                                            {name || 'Club Preview'}
                                        </Text>
                                    </LinearGradient>
                                </>
                            ) : (
                                <LinearGradient
                                    colors={['#3B82F6', '#9333EA']}
                                    className="w-full h-full rounded-2xl items-center justify-center"
                                >
                                    <FontAwesome name="image" size={40} color="#FFFFFF" />
                                    <Text className="text-white mt-2 text-sm font-semibold">Add Club Image</Text>
                                </LinearGradient>
                            )}
                        </GlassContainer>

                        <View className="mb-4">
                            <GlassInput
                                label="Image URL (Optional)"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChangeText={setImageUrl}
                                autoCapitalize="none"
                                keyboardType="url"
                                icon="link"
                            />
                        </View>

                        {/* Club Name */}
                        <View className="mb-4">
                            <GlassInput
                                label="Club Name *"
                                placeholder="Enter club name"
                                value={name}
                                onChangeText={setName}
                                maxLength={50}
                                icon="group"
                            />
                        </View>

                        {/* Category */}
                        <View className="mb-4">
                            <GlassInput
                                label="Category (Optional)"
                                placeholder="e.g., Sports, Technology, Arts"
                                value={category}
                                onChangeText={setCategory}
                                icon="tag"
                            />
                        </View>

                        {/* Description */}
                        <View className="mb-6">
                            <Text className="text-gray-300 font-semibold mb-2 text-sm ml-1">Description *</Text>
                            <GlassContainer className="p-4" intensity={20}>
                                <TextInput
                                    className="flex-1 text-base text-white"
                                    placeholder="Describe your club..."
                                    placeholderTextColor="#9CA3AF"
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    textAlignVertical="top"
                                    style={{ minHeight: 100 }}
                                />
                                <View className="flex-row justify-between items-center mt-2">
                                    <View className="flex-row items-center">
                                        <FontAwesome name="info-circle" size={12} color="#9CA3AF" />
                                        <Text className="text-gray-500 text-xs ml-1">
                                            Max 500 characters
                                        </Text>
                                    </View>
                                    <Text className="text-gray-500 text-xs">
                                        {description.length} characters
                                    </Text>
                                </View>
                            </GlassContainer>
                        </View>

                        {/* Create Button */}
                        <TouchableOpacity
                            onPress={handleCreate}
                            disabled={loading}
                            className="mb-6 rounded-2xl overflow-hidden"
                        >
                            <LinearGradient
                                colors={loading ? ['#6B7280', '#4B5563'] : ['#A855F7', '#9333EA']}
                                className="py-5 items-center justify-center"
                                style={{ opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? (
                                    <View className="flex-row items-center">
                                        <Text className="text-white font-bold text-lg mr-3">Creating...</Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center">
                                        <FontAwesome name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
                                        <Text className="text-white font-bold text-lg">Create Club</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}


