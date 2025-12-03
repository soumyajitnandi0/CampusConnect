import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function GlassTabBarBackground() {
    return (
        <View style={StyleSheet.absoluteFill} className="overflow-hidden rounded-t-3xl border-t border-glass-border bg-glass-black/50">
            <BlurView
                tint="dark"
                intensity={80}
                style={StyleSheet.absoluteFill}
            />
        </View>
    );
}
