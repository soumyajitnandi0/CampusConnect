import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { cn } from '../../utils/cn';

interface GlassButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
    className?: string;
    textClassName?: string;
    icon?: React.ComponentProps<typeof FontAwesome>['name'] | React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
    title,
    variant = 'primary',
    loading = false,
    className,
    textClassName,
    disabled,
    icon,
    ...props
}) => {
    const baseStyles = 'flex-row items-center justify-center rounded-xl px-6 py-4';

    const variants = {
        primary: 'bg-white',
        secondary: 'bg-glass-white border border-glass-border',
        outline: 'bg-transparent border border-white/30',
    };

    const textVariants = {
        primary: 'text-black font-bold',
        secondary: 'text-white font-medium',
        outline: 'text-white font-medium',
    };

    return (
        <TouchableOpacity
            className={cn(
                baseStyles,
                variants[variant],
                disabled && 'opacity-50',
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? 'black' : 'white'} />
            ) : (
                <>
                    {typeof icon === 'string' ? (
                        <FontAwesome
                            name={icon as any}
                            size={20}
                            color={variant === 'primary' ? 'black' : 'white'}
                            style={{ marginRight: 8 }}
                        />
                    ) : (
                        icon
                    )}
                    <Text className={cn('text-base', textVariants[variant], textClassName)}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};
