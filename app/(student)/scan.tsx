import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Camera, CameraView } from "expo-camera";
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.text}>Requesting camera permission...</Text>
            </View>
        );
    }
    
    if (hasPermission === false) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <FontAwesome name="camera" size={48} color="#9CA3AF" />
                <Text style={[styles.text, { marginTop: 16 }]}>Camera access denied</Text>
                <Text style={[styles.text, { fontSize: 14, color: '#6B7280', marginTop: 8 }]}>
                    Please enable camera permissions in settings
                </Text>
            </View>
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
                <Text style={styles.instructionText}>
                    Position QR code within the frame
                </Text>
            </View>
            {scanned && (
                <View style={styles.scannedOverlay}>
                    <TouchableOpacity
                        style={styles.scanAgainButton}
                        onPress={() => setScanned(false)}
                    >
                        <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    text: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
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
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#2563EB',
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
    instructionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 40,
        textAlign: 'center',
    },
    scannedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanAgainButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    scanAgainText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
