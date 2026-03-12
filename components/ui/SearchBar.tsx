/**
 * SearchBar — shared search input primitive.
 * Renders the input wrapper, leading icon, and optional clear button.
 * Does NOT include screen-specific trailing action buttons — those stay in the caller.
 */

import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';

type Props = {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    /** Called when the clear button is tapped; if omitted, clear button does not appear */
    onClear?: () => void;
    /** Extra props forwarded to the underlying TextInput */
    autoFocus?: boolean;
    autoCorrect?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    returnKeyType?: 'done' | 'search' | 'next' | 'go' | 'send';
    onSubmitEditing?: () => void;
    /** Optional container style override — use for margin/padding adjustments only */
    style?: ViewStyle;
};

export default function SearchBar({
    value,
    onChangeText,
    placeholder,
    onClear,
    autoFocus,
    autoCorrect,
    autoCapitalize = 'none',
    returnKeyType,
    onSubmitEditing,
    style,
}: Props) {
    const theme = useThemeColors();

    return (
        <View style={[styles.wrapper, { backgroundColor: theme.surface }, style]}>
            <Ionicons name="search" size={18} color={theme.mutedText} style={styles.icon} />
            <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={placeholder}
                placeholderTextColor={theme.mutedText}
                value={value}
                onChangeText={onChangeText}
                autoCapitalize={autoCapitalize}
                autoFocus={autoFocus}
                autoCorrect={autoCorrect}
                returnKeyType={returnKeyType}
                onSubmitEditing={onSubmitEditing}
            />
            {value.length > 0 && onClear && (
                <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={16} color={theme.mutedText} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
    },
    clearBtn: {
        padding: 4,
    },
});
