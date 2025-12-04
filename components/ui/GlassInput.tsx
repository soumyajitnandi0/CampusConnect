import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Theme } from '../../constants/theme';
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
    style,
    ...props
}) => {
    return (
        <View className={cn('w-full', containerClassName)} style={containerStyle}>
            {label && (
                <Text style={styles.label}>
                    {label}
                </Text>
            )}
            <View style={[
                styles.inputContainer,
                error && styles.inputContainerError
            ]}>
                <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.inputContent}>
                    {icon && (
                        <FontAwesome 
                            name={icon} 
                            size={18} 
                            color={Theme.colors.text.muted} 
                            style={styles.icon}
                        />
                    )}
                    <TextInput
                        style={styles.input}
                        placeholderTextColor={Theme.colors.text.disabled}
                        {...props}
                    />
                </View>
            </View>
            {error && (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: Theme.typography.fontSize.sm,
        fontWeight: '600',
        color: Theme.colors.text.tertiary,
        marginBottom: Theme.spacing.xs,
        marginLeft: Theme.spacing.xs,
    },
    inputContainer: {
        height: 52,
        borderRadius: Theme.radius.md,
        overflow: 'hidden',
        backgroundColor: Theme.colors.glass.medium,
        borderWidth: 1,
        borderColor: Theme.colors.glass.borderLight,
        ...Theme.shadows.sm,
    },
    inputContainerError: {
        borderColor: Theme.colors.accent.red + '60',
    },
    inputContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
    },
    icon: {
        marginRight: Theme.spacing.md,
    },
    input: {
        flex: 1,
        fontSize: Theme.typography.fontSize.base,
        color: Theme.colors.text.secondary,
        fontWeight: '500',
        paddingVertical: 0,
    },
    errorText: {
        fontSize: Theme.typography.fontSize.xs,
        color: Theme.colors.accent.red,
        marginTop: Theme.spacing.xs,
        marginLeft: Theme.spacing.xs,
    },
});
