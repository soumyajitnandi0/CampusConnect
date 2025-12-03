import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Camera, CameraView } from "expo-camera";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { CheckInService } from '../../services/checkin.service';
import { decodeQRData, isQRCodeExpired } from '../../utils/qr-code.utils';

export default function OrganizerScannerScreen() {
    const router = useRouter();
    const { eventId } = useLocalSearchParams<{ eventId?: string }>();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
        };

        getCameraPermissions();
    }, []);

    const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
        if (scanned || processing) return;

        setScanned(true);
        setProcessing(true);

        try {
            console.log('Scanned QR data:', data);

            // Decode QR data
            const qrData = decodeQRData(data);

            if (!qrData) {
                Alert.alert(
                    'Invalid QR Code',
                    'This QR code is not valid. Please scan a student\'s check-in QR code.',
                    [{
                        text: 'OK', onPress: () => {
                            setScanned(false);
                            setProcessing(false);
                        }
                    }]
                );
                return;
            }

            console.log('Decoded QR data:', qrData);

            // Check if QR code is expired
            if (isQRCodeExpired(qrData)) {
                Alert.alert(
                    'Expired QR Code',
                    'This QR code has expired (older than 24 hours). Please ask the student to generate a new one.',
                    [{
                        text: 'OK', onPress: () => {
                            setScanned(false);
                            setProcessing(false);
                        }
                    }]
                );
                return;
            }

            // If eventId is provided (from event details), verify it matches
            if (eventId && qrData.eventId !== eventId) {
                Alert.alert(
                    'Wrong Event',
                    'This QR code is for a different event. Please scan the correct QR code for this event.',
                    [{
                        text: 'OK', onPress: () => {
                            setScanned(false);
                            setProcessing(false);
                        }
                    }]
                );
                return;
            }

            // Use eventId from QR code if not provided
            const targetEventId = eventId || qrData.eventId;

            if (!targetEventId) {
                Alert.alert(
                    'Error',
                    'Event ID not found in QR code.',
                    [{
                        text: 'OK', onPress: () => {
                            setScanned(false);
                            setProcessing(false);
                        }
                    }]
                );
                return;
            }

            if (!qrData.userId) {
                Alert.alert(
                    'Error',
                    'User ID not found in QR code.',
                    [{
                        text: 'OK', onPress: () => {
                            setScanned(false);
                            setProcessing(false);
                        }
                    }]
                );
                return;
            }

            console.log('Checking in user:', qrData.userId, 'to event:', targetEventId);

            // Check in user
            try {
                await CheckInService.checkInUser(targetEventId, qrData.userId, qrData);

                Alert.alert(
                    'Success! ✓',
                    'Student has been checked in successfully.',
                    [{
                        text: 'OK',
                        onPress: () => {
                            setScanned(false);
                            setProcessing(false);
                            // Wait a bit before allowing next scan
                            setTimeout(() => {
                                setScanned(false);
                            }, 1000);
                        }
                    }]
                );
            } catch (checkInError: any) {
                // Handle "already checked in" as a friendly message
                if (checkInError.message && (
                    checkInError.message.toLowerCase().includes('already checked in') ||
                    checkInError.message.toLowerCase().includes('already checked')
                )) {
                    Alert.alert(
                        'Already Checked In ✓',
                        'This student has already been checked in for this event.',
                        [{
                            text: 'OK',
                            onPress: () => {
                                setScanned(false);
                                setProcessing(false);
                                setTimeout(() => {
                                    setScanned(false);
                                }, 1000);
                            }
                        }]
                    );
                } else {
                    // Re-throw other errors to be caught by outer catch
                    throw checkInError;
                }
            }
        } catch (err: any) {
            console.error('Check-in error:', err);
            const errorMessage = err.message || 'Check-in failed. Please try again.';
            Alert.alert(
                'Check-in Failed',
                errorMessage,
                [{
                    text: 'OK', onPress: () => {
                        setScanned(false);
                        setProcessing(false);
                    }
                }]
            );
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
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => router.back()}
                >
                    <FontAwesome name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.scanArea}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <GlassContainer className="mt-10 px-6 py-3 rounded-full" intensity={30}>
                    <Text className="text-white font-semibold text-center">
                        Scan student QR code to check in
                    </Text>
                </GlassContainer>
            </View>
            {scanned && (
                <View style={styles.scannedOverlay}>
                    {processing ? (
                        <GlassContainer className="items-center p-6">
                            <ActivityIndicator size="large" color="#FFFFFF" />
                            <Text className="text-white font-semibold mt-4">Processing check-in...</Text>
                        </GlassContainer>
                    ) : (
                        <GlassButton
                            title="Tap to Scan Again"
                            onPress={() => {
                                setScanned(false);
                                setProcessing(false);
                            }}
                            className="bg-purple-600/80 border-purple-400/50"
                        />
                    )}
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
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
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
        borderColor: '#A855F7',
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

