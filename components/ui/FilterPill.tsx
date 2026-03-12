/**
 * FilterPill — shared filter chip/pill UI primitive.
 * Visual only — caller owns filter state and behavior.
 */

import { useThemeColors } from '@/hooks/useThemeColors';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

type Props = {
    /** Display label for the pill */
    label: string;
    /** Whether this pill is the currently active selection */
    active: boolean;
    /** Called when the pill is pressed */
    onPress: () => void;
    /** Active background color — defaults to theme.primary */
    activeColor?: string;
    /** Whether the pill is non-interactive */
    disabled?: boolean;
};

export default function FilterPill({ label, active, onPress, activeColor, disabled }: Props) {
    const theme = useThemeColors();
    const activeBg = activeColor ?? theme.primary;

    return (
        <TouchableOpacity
            style={[
                styles.pill,
                active
                    ? { backgroundColor: activeBg, borderColor: activeBg }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.75}
        >
            <Text
                style={[
                    styles.label,
                    { color: active ? '#fff' : theme.text },
                    active && { fontWeight: 'bold' },
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
    },
});
