import { useThemeColors } from '@/hooks/useThemeColors';
import { StyleSheet, Text, View } from 'react-native';

type Tone = 'neutral' | 'sealed' | 'sold';
type Size = 'md' | 'sm' | 'xs';

type Props = {
    label: string;
    tone?: Tone;
    size?: Size;
    /** White-on-translucent styling for chips drawn over card artwork. */
    onImage?: boolean;
};

const SIZES = {
    md: { fontSize: 9, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
    sm: { fontSize: 8, paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4 },
    xs: { fontSize: 8, paddingHorizontal: 3, paddingVertical: 0, borderRadius: 3 },
} as const;

export default function InventoryChip({ label, tone = 'neutral', size = 'md', onImage = false }: Props) {
    const theme = useThemeColors();
    const { fontSize, ...box } = SIZES[size];

    let backgroundColor: string;
    let color: string;
    if (tone === 'sealed') {
        backgroundColor = theme.sealed;
        color = '#fff';
    } else if (tone === 'sold') {
        backgroundColor = onImage ? theme.success : theme.successSurface;
        color = onImage ? '#fff' : theme.onSuccessSurface;
    } else {
        backgroundColor = onImage ? 'rgba(255,255,255,0.2)' : theme.border;
        color = onImage ? '#fff' : theme.text;
    }

    return (
        <View style={[box, { backgroundColor }]}>
            <Text style={[styles.text, { fontSize, color }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    text: {
        fontWeight: 'bold',
    },
});
