import ModalShell from '@/components/ui/ModalShell';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { sheetStyles as styles } from './sheetStyles';
import type { Collection } from './types';

type Props = {
    visible: boolean;
    onClose: () => void;
    collections: Collection[];
    selectedIds: string[];
    onToggle: (collectionId: string) => void;
    saving: boolean;
    onSave: () => void;
};

export default function AddToCollectionSheet({ visible, onClose, collections, selectedIds, onToggle, saving, onSave }: Props) {
    const theme = useThemeColors();

    return (
        <ModalShell visible={visible} onClose={onClose} title="Add to Collection" type="bottom-sheet">
            <ScrollView style={styles.sheetBody}>
                <Text style={[styles.sectionHeading, { color: theme.mutedText, marginBottom: 8 }]}>SELECT COLLECTIONS</Text>

                {collections.length === 0 ? (
                    <Text style={{ color: theme.mutedText, padding: 16, textAlign: 'center' }}>You don&apos;t have any collections yet.</Text>
                ) : (
                    collections.map(c => {
                        const isSelected = selectedIds.includes(c.id);
                        return (
                            <TouchableOpacity
                                key={c.id}
                                style={styles.optionRow}
                                onPress={() => onToggle(c.id)}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: isSelected }}
                            >
                                <Text
                                    style={[styles.optionText, { color: isSelected ? theme.primary : theme.text, fontWeight: isSelected ? '700' : '400', flex: 1 }]}
                                    numberOfLines={1}
                                >
                                    {c.name}
                                </Text>
                                {isSelected && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                            </TouchableOpacity>
                        );
                    })
                )}

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.primary, marginTop: 24, paddingVertical: 14, opacity: collections.length === 0 ? 0.5 : 1 }]}
                    onPress={onSave}
                    disabled={saving || collections.length === 0}
                    accessibilityRole="button"
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </ModalShell>
    );
}
