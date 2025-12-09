import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, CameraView } from "expo-camera";
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import api from '../../services/api';

export default function ScanScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
        };

        getCameraPermissions();
    }, []);

    const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
        setScanned(true);
        try {
            // Assuming data is the event ID or a JSON with eventId
            // For simplicity, let's assume data IS the eventId or a JSON string
            let eventId = data;
            try {
                const parsed = JSON.parse(data);
                if (parsed.eventId) eventId = parsed.eventId;
            } catch (_) {
                // Not JSON, use raw data
            }

            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'You must be logged in to scan');
                return;
            }

            const res = await api.post('/attendance/verify', { eventId }, {
                headers: { 'x-auth-token': token }
            });

            Alert.alert('Success', res.data.msg);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.msg || 'Scan failed');
        }
    };

    if (hasPermission === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "pdf417"],
                }}
                style={StyleSheet.absoluteFillObject}
            />
            {scanned && <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
    },
});
