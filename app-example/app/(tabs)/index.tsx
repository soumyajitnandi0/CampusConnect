import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import api from '../../services/api';

export default function HomeScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleRSVP = async (eventId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/(auth)/login');
        return;
      }

      await api.post(`/events/${eventId}/rsvp`, { status: 'going' }, {
        headers: { 'x-auth-token': token }
      });
      alert('RSVP Successful!');
      fetchEvents(); // Refresh to show updated count
    } catch (_) {
      alert('RSVP Failed');
    }
  };

  const renderEvent = ({ item }: { item: any }) => (
    <View className="bg-white rounded-lg shadow-md mb-4 overflow-hidden mx-4 mt-2">
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} className="w-full h-40" resizeMode="cover" />
      )}
      <View className="p-4">
        <Text className="text-xl font-bold mb-1">{item.title}</Text>
        <Text className="text-gray-600 mb-2">{new Date(item.date).toDateString()} • {item.location}</Text>
        <Text className="text-gray-700 mb-3" numberOfLines={2}>{item.description}</Text>

        <View className="flex-row justify-between items-center">
          <Text className="text-blue-600 font-semibold">{item.rsvpCount} Attending</Text>
          <TouchableOpacity
            className="bg-blue-600 px-4 py-2 rounded-full"
            onPress={() => handleRSVP(item._id)}
          >
            <Text className="text-white font-bold">RSVP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <View className="flex-1 bg-gray-100 pt-2">
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text className="text-center mt-10 text-gray-500">No events found</Text>}
      />

      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full justify-center items-center shadow-lg"
        onPress={() => router.push('/create-event')}
      >
        <Text className="text-white text-3xl pb-1">+</Text>
      </TouchableOpacity>
    </View>
  );
}
