import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, SafeAreaView, StatusBar, View, ViewProps } from 'react-native';
import { cn } from '../../utils/cn';

interface ScreenWrapperProps extends ViewProps {
    children: React.ReactNode;
    className?: string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
    children,
    className,
    style,
    ...props
}) => {
    return (
        <View className="flex-1 bg-black">
            <LinearGradient
                colors={['#111111', '#000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
            />
            {/* Decorative gradients for glass effect */}
            <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute top-[-20%] left-[-20%] h-[60%] w-[60%] rounded-full opacity-50"
            />
            <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.03)']}
                start={{ x: 1, y: 1 }}
                end={{ x: 0, y: 0 }}
                className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full opacity-50"
            />

            <SafeAreaView
                className={cn('flex-1', className)}
                style={[
                    { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
                    style
                ]}
                {...props}
            >
                {children}
            </SafeAreaView>
        </View>
    );
};
