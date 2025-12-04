import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { GlassInput } from '../../components/ui/GlassInput';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { ClubService } from '../../services/club.service';
import { uploadImage } from '../../services/upload.service';
import { getClubImageUrl } from '../../utils/cloudinary';
import { storage } from "../../utils/storage";

export default function CreateClub() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imagePublicId, setImagePublicId] = useState<string | null>(null);
    const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    useEffect(() => {
        requestImagePermission();
    }, []);

    const requestImagePermission = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'We need access to your photos to upload club images.');
            }
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1], // Square aspect ratio for club images
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setImagePreviewUri(asset.uri);
                
                // Upload image
                setUploadingImage(true);
                try {
                    const uploadResult = await uploadImage(asset.uri, 'clubs');
                    setImagePublicId(uploadResult.publicId);
                    Alert.alert('Success', 'Image uploaded successfully');
                } catch (error: any) {
                    Alert.alert('Upload Failed', error.message || 'Failed to upload image');
                    setImagePreviewUri(null);
                } finally {
                    setUploadingImage(false);
                }
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to pick image');
        }
    };

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

            // Use Cloudinary public ID for image
            const cleanImageUrl = imagePublicId || undefined;

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
                    contentContainerStyle={{ paddingBottom: 120 }}
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
                            {imagePreviewUri || imagePublicId ? (
                                <>
                                    <Image
                                        source={{ 
                                            uri: imagePreviewUri || (imagePublicId ? getClubImageUrl(imagePublicId, 400) : '')
                                        }}
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
                                    {uploadingImage && (
                                        <View className="absolute inset-0 items-center justify-center bg-black/50 rounded-2xl">
                                            <ActivityIndicator size="large" color="#A855F7" />
                                            <Text className="text-white mt-2 text-sm">Uploading...</Text>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    disabled={uploadingImage}
                                    activeOpacity={0.8}
                                    className="w-full h-full"
                                >
                                    <LinearGradient
                                        colors={['#3B82F6', '#9333EA']}
                                        className="w-full h-full rounded-2xl items-center justify-center"
                                    >
                                        {uploadingImage ? (
                                            <>
                                                <ActivityIndicator size="large" color="#FFFFFF" />
                                                <Text className="text-white mt-2 text-sm font-semibold">Uploading...</Text>
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesome name="image" size={40} color="#FFFFFF" />
                                                <Text className="text-white mt-2 text-sm font-semibold">Tap to Upload</Text>
                                                <Text className="text-white/70 mt-1 text-xs">Square image recommended</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </GlassContainer>

                        {/* Image Actions */}
                        {(imagePreviewUri || imagePublicId) && (
                            <View className="mb-4 flex-row gap-2">
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    disabled={uploadingImage}
                                    className="flex-1"
                                    activeOpacity={0.7}
                                >
                                    <GlassContainer className="p-3 items-center" intensity={20}>
                                        <FontAwesome name="refresh" size={16} color="#A855F7" />
                                        <Text className="text-gray-300 text-xs mt-1">Change Image</Text>
                                    </GlassContainer>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setImagePublicId(null);
                                        setImagePreviewUri(null);
                                    }}
                                    disabled={uploadingImage}
                                    className="flex-1"
                                    activeOpacity={0.7}
                                >
                                    <GlassContainer className="p-3 items-center" intensity={20}>
                                        <FontAwesome name="trash" size={16} color="#EF4444" />
                                        <Text className="text-gray-300 text-xs mt-1">Remove</Text>
                                    </GlassContainer>
                                </TouchableOpacity>
                            </View>
                        )}

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


