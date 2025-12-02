import FontAwesome from '@expo/vector-icons/FontAwesome';
import { storage } from "../../utils/storage";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../../services/api';

export default function FeedbackScreen() {
    const { eventId, eventTitle } = useLocalSearchParams();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const router = useRouter();

    const handleSubmit = async () => {
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
        }
    };

    return (
        <View className="flex-1 bg-white p-6 justify-center">
            <Text className="text-2xl font-bold mb-2 text-center">Rate Event</Text>
            <Text className="text-gray-600 text-center mb-8">{eventTitle}</Text>

            <View className="flex-row justify-center mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)} className="mx-2">
                        <FontAwesome
                            name={star <= rating ? "star" : "star-o"}
                            size={40}
                            color="#fbbf24"
                        />
                    </TouchableOpacity>
                ))}
            </View>

            <Text className="mb-2 font-semibold">Comments (Optional)</Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-8 h-32"
                value={comment}
                onChangeText={setComment}
                placeholder="Share your experience..."
                multiline
                textAlignVertical="top"
            />

            <TouchableOpacity
                className="bg-blue-600 p-4 rounded-lg items-center"
                onPress={handleSubmit}
            >
                <Text className="text-white font-bold text-lg">Submit Feedback</Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="mt-4 p-4 items-center"
                onPress={() => router.back()}
            >
                <Text className="text-gray-500">Cancel</Text>
            </TouchableOpacity>
        </View>
    );
}
