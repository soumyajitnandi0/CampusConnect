import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Camera, CameraView } from "expo-camera";
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useAuth } from '../../contexts/auth.context';
import { CheckInService } from '../../services/checkin.service';
import { decodeQRData } from '../../utils/qr-code.utils';

export default function ScanScreen() {
    const { user } = useAuth();
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
        if (scanned || !user) return;

        setScanned(true);
        try {
            // Try to decode QR data
            const qrData = decodeQRData(data);

            if (!qrData) {
                Alert.alert('Error', 'Invalid QR code format');
                setScanned(false);
                return;
            }

            // Check in using QR data
            await CheckInService.checkInUser(qrData.eventId, user.id, qrData);
            Alert.alert('Success', 'Check-in successful!');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Check-in failed');
        } finally {
            setTimeout(() => setScanned(false), 2000);
        }
    };

    if (hasPermission === null) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <Text className="text-white">Requesting camera permission...</Text>
            </ScreenWrapper>
        );
    }

    if (hasPermission === false) {
        return (
            <ScreenWrapper className="justify-center items-center p-6">
                <GlassContainer className="items-center p-8">
                    <FontAwesome name="camera" size={48} color="#9CA3AF" />
                    <Text className="text-white text-lg font-bold mt-4">Camera access denied</Text>
                    <Text className="text-gray-400 text-center mt-2">
                        Please enable camera permissions in settings
                    </Text>
                </GlassContainer>
            </ScreenWrapper>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.overlay}>
                <View style={styles.scanArea}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <GlassContainer className="mt-10 px-6 py-3 rounded-full" intensity={30}>
                    <Text className="text-white font-semibold text-center">
                        Position QR code within the frame
                    </Text>
                </GlassContainer>
            </View>
            {scanned && (
                <View style={styles.scannedOverlay}>
                    <GlassButton
                        title="Tap to Scan Again"
                        onPress={() => setScanned(false)}
                        className="bg-blue-600/80 border-blue-400/50"
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanArea: {
        width: 250,
        height: 250,
        position: 'relative',
        backgroundColor: 'transparent',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#60A5FA',
        borderWidth: 3,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    scannedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});
