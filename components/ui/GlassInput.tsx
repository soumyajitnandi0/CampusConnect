import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { cn } from '../../utils/cn';

interface GlassInputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerClassName?: string;
    icon?: React.ComponentProps<typeof FontAwesome>['name'];
    containerStyle?: ViewStyle;
}

export const GlassInput: React.FC<GlassInputProps> = ({
    label,
    error,
    containerClassName,
    className,
    icon,
    containerStyle,
    ...props
}) => {
    return (
        <View className={cn('w-full space-y-2', containerClassName)} style={containerStyle}>
            {label && <Text className="text-sm font-medium text-gray-300 ml-1">{label}</Text>}
            <View className={cn(
                'w-full flex-row items-center rounded-xl border border-glass-border bg-glass-white px-4',
                error && 'border-red-500'
            )}>
                {icon && (
                    <FontAwesome name={icon} size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
                )}
                <TextInput
                    className={cn(
                        'flex-1 py-4 text-white placeholder:text-gray-500',
                        className
                    )}
                    placeholderTextColor="#6B7280"
                    {...props}
                />
            </View>
            {error && <Text className="text-xs text-red-400 ml-1">{error}</Text>}
        </View>
    );
};
