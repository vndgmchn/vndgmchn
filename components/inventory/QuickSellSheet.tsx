import ModalShell from '@/components/ui/ModalShell';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { sheetStyles as styles } from './sheetStyles';

type Props = {
    visible: boolean;
    onClose: () => void;
    maxQuantity: number;
    quantity: string;
    onChangeQuantity: (value: string) => void;
    soldPrice: string;
    onChangeSoldPrice: (value: string) => void;
    costBasis: string;
    onChangeCostBasis: (value: string) => void;
    onSave: () => void;
};

export default function QuickSellSheet({
    visible, onClose, maxQuantity, quantity, onChangeQuantity,
    soldPrice, onChangeSoldPrice, costBasis, onChangeCostBasis, onSave,
}: Props) {
    const theme = useThemeColors();
    const inputStyle = [styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }];

    return (
        <ModalShell visible={visible} onClose={onClose} title="Mark as Sold" type="bottom-sheet" useKeyboardAvoiding>
            <View style={styles.sheetBody}>
                {maxQuantity > 1 && (
                    <>
                        <Text style={[styles.label, { color: theme.text }]}>Sell Quantity (max {maxQuantity})</Text>
                        <TextInput
                            style={inputStyle}
                            value={quantity}
                            onChangeText={onChangeQuantity}
                            keyboardType="number-pad"
                        />
                    </>
                )}
                <Text style={[styles.label, { color: theme.text }]}>Sold For ($)</Text>
                <TextInput
                    style={inputStyle}
                    value={soldPrice}
                    onChangeText={onChangeSoldPrice}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.mutedText}
                    autoFocus
                />

                <Text style={[styles.label, { color: theme.text }]}>
                    Bought For ($) <Text style={{ fontWeight: 'normal', color: theme.mutedText }}>(Optional)</Text>
                </Text>
                <TextInput
                    style={inputStyle}
                    value={costBasis}
                    onChangeText={onChangeCostBasis}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.mutedText}
                />

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.primary, marginTop: 8, marginBottom: 20 }]}
                    onPress={onSave}
                    accessibilityRole="button"
                >
                    <Text style={styles.saveButtonText}>Save Sale</Text>
                </TouchableOpacity>
            </View>
        </ModalShell>
    );
}
