import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { GlassInput } from '../../components/ui/GlassInput';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import api from '../../services/api';
import { storage } from "../../utils/storage";

export default function FeedbackScreen() {
    const { eventId, eventTitle } = useLocalSearchParams();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const token = await storage.getItem('token');
            await api.post('/feedback', {
                eventId,
                rating,
                comment
            }, {
                headers: { 'x-auth-token': token }
            });

            Alert.alert('Success', 'Thank you for your feedback!');
            router.back();
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.msg || 'Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScreenWrapper className="justify-center p-6">
            <GlassContainer className="p-6 w-full">
                <Text className="text-2xl font-bold mb-2 text-center text-white">Rate Event</Text>
                <Text className="text-gray-300 text-center mb-8">{eventTitle}</Text>

                <View className="flex-row justify-center mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setRating(star)} className="mx-2">
                            <FontAwesome
                                name={star <= rating ? "star" : "star-o"}
                                size={40}
                                color={star <= rating ? "#FBBF24" : "#4B5563"}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <GlassInput
                    label="Comments (Optional)"
                    placeholder="Share your experience..."
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={4}
                    className="h-32 text-top"
                    containerClassName="mb-8"
                />

                <GlassButton
                    title="Submit Feedback"
                    onPress={handleSubmit}
                    loading={submitting}
                    className="mb-4"
                />

                <GlassButton
                    title="Cancel"
                    onPress={() => router.back()}
                    variant="outline"
                    className="border-gray-500"
                />
            </GlassContainer>
        </ScreenWrapper>
    );
}
