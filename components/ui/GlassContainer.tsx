import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { cn } from '../../utils/cn';

interface GlassContainerProps extends ViewProps {
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    className?: string;
    contentClassName?: string;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
    children,
    intensity = 20,
    tint = 'dark',
    className,
    contentClassName,
    style,
    ...props
}) => {
    return (
        <View
            className={cn(
                'overflow-hidden rounded-2xl border border-glass-border bg-glass-black/30 relative',
                className
            )}
            style={style}
            {...props}
        >
            <BlurView
                intensity={intensity}
                tint={tint}
                style={StyleSheet.absoluteFill}
            />
            <View className={cn('p-4', contentClassName)}>
                {children}
            </View>
        </View>
    );
};
