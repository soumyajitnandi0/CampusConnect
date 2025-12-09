import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import api from '../services/api';

export default function CreateEvent() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [date] = useState(new Date());
    const [category, setCategory] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const router = useRouter();

    const handleCreate = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Not authorized');
                return;
            }

            await api.post('/events', {
                title,
                description,
                date,
                location,
                category,
                imageUrl
            }, {
                headers: { 'x-auth-token': token }
            });

            Alert.alert('Success', 'Event created successfully');
            router.back();
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.msg || 'Failed to create event');
        }
    };

    return (
        <ScrollView className="flex-1 bg-white p-4">
            <Text className="text-2xl font-bold mb-6">Create New Event</Text>

            <Text className="mb-1 font-semibold">Event Title</Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-4"
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Tech Talk 2024"
            />

            <Text className="mb-1 font-semibold">Description</Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-4 h-24"
                value={description}
                onChangeText={setDescription}
                placeholder="Event details..."
                multiline
                textAlignVertical="top"
            />

            <Text className="mb-1 font-semibold">Location</Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-4"
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Auditorium A"
            />

            <Text className="mb-1 font-semibold">Category</Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-4"
                value={category}
                onChangeText={setCategory}
                placeholder="e.g. Workshop"
            />

            <Text className="mb-1 font-semibold">Image URL</Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-6"
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="https://..."
            />

            <TouchableOpacity
                className="bg-blue-600 p-4 rounded-lg items-center mb-10"
                onPress={handleCreate}
            >
                <Text className="text-white font-bold text-lg">Create Event</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
