import ModalShell from '@/components/ui/ModalShell';
import { useThemeColors } from '@/hooks/useThemeColors';
import { convertToUsd, formatUsd } from '@/lib/format';
import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { sheetStyles } from './sheetStyles';
import type { InventoryStatus } from './types';

const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG'] as const;
const GRADING_COMPANIES = ['PSA', 'BGS', 'CGC', 'SGC', 'Other'] as const;
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const STATUSES: InventoryStatus[] = ['FOR_SALE', 'PENDING', 'SOLD', 'PERSONAL'];

type Props = {
    visible: boolean;
    onClose: () => void;
    /** Status of the item being edited, or null when adding. */
    editingStatus: InventoryStatus | null;
    targetCollectionName: string | null;
    imageUrl: string | null;
    setLine: string | null;
    titleLocked: boolean;
    market: { price: number | null; currency: string | null; source: string | null };

    title: string;
    onChangeTitle: (value: string) => void;
    condition: string | null;
    onChangeCondition: (value: string | null) => void;
    isGraded: boolean;
    onChangeGraded: (value: boolean) => void;
    gradingCompany: string | null;
    onChangeGradingCompany: (value: string) => void;
    grade: number | null;
    onChangeGrade: (value: number) => void;
    quantity: string;
    onChangeQuantity: (value: string) => void;
    listingPrice: string;
    onChangeListingPrice: (value: string) => void;
    costBasis: string;
    onChangeCostBasis: (value: string) => void;
    status: InventoryStatus;
    onChangeStatus: (value: InventoryStatus) => void;
    soldPrice: string;
    onChangeSoldPrice: (value: string) => void;

    saving: boolean;
    onSave: () => void;
    onDelete: () => void;
};

export default function ItemFormSheet(props: Props) {
    const {
        visible, onClose, editingStatus, targetCollectionName, imageUrl, setLine, titleLocked, market,
        title, onChangeTitle, condition, onChangeCondition, isGraded, onChangeGraded,
        gradingCompany, onChangeGradingCompany, grade, onChangeGrade,
        quantity, onChangeQuantity, listingPrice, onChangeListingPrice, costBasis, onChangeCostBasis,
        status, onChangeStatus, soldPrice, onChangeSoldPrice, saving, onSave, onDelete,
    } = props;
    const theme = useThemeColors();
    const isEditing = editingStatus !== null;
    const inputStyle = [sheetStyles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }];

    const renderChoices = <T extends string | number>(options: readonly T[], selected: T | null, onPress: (value: T) => void) => (
        <View style={sheetStyles.choiceGroup}>
            {options.map((option) => {
                const isActive = selected === option;
                return (
                    <TouchableOpacity
                        key={option}
                        style={[sheetStyles.choiceChip, { backgroundColor: isActive ? theme.primary : theme.surface, borderColor: theme.border }]}
                        onPress={() => onPress(option)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isActive }}
                    >
                        <Text style={{ color: isActive ? '#fff' : theme.text, fontSize: 12 }}>{option}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    // Quick Sell owns the transition into SOLD (it splits stacks), so the form only allows staying on the same side.
    const allowedStatuses = STATUSES.filter(s => (s === 'SOLD') === (editingStatus === 'SOLD'));

    const cancelButton = (
        <TouchableOpacity onPress={onClose} accessibilityRole="button">
            <Text style={{ color: theme.primary, fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
    );

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={isEditing ? 'Edit Item' : 'Add Item'}
            type="page-sheet"
            hideClose
            useKeyboardAvoiding
            headerRight={cancelButton}
        >
            <ScrollView style={sheetStyles.modalBody} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
                {!isEditing && targetCollectionName && (
                    <View style={[styles.collectionBanner, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="folder" size={16} color={theme.primary} style={{ marginRight: 8 }} />
                        <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13, flex: 1 }}>
                            Adding directly to <Text style={{ fontWeight: '800' }}>{targetCollectionName}</Text>
                        </Text>
                    </View>
                )}
                {imageUrl && (
                    <View style={{ alignItems: 'center', marginBottom: 12 }}>
                        <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
                    </View>
                )}
                {setLine && (
                    <Text style={{ color: theme.mutedText, textAlign: 'center', marginBottom: 20 }}>{setLine}</Text>
                )}

                <Text style={[sheetStyles.label, { color: theme.text }]}>Title</Text>
                <TextInput
                    style={[inputStyle, titleLocked && { color: theme.mutedText }]}
                    value={title}
                    onChangeText={onChangeTitle}
                    placeholder="Charizard Base Set"
                    placeholderTextColor={theme.mutedText}
                    editable={!titleLocked}
                />

                <Text style={[sheetStyles.label, { color: theme.text, marginTop: 16 }]}>Item Details</Text>

                {!isGraded && (
                    <View style={{ marginBottom: 12 }}>
                        <Text style={[sheetStyles.label, { color: theme.mutedText, fontSize: 12 }]}>Condition</Text>
                        {renderChoices(CONDITIONS, condition as typeof CONDITIONS[number] | null, (c) => onChangeCondition(condition === c ? null : c))}
                    </View>
                )}

                <View style={[sheetStyles.row, { alignItems: 'center', marginBottom: 12 }]}>
                    <Text style={[sheetStyles.label, { color: theme.text, marginBottom: 0 }]}>Graded</Text>
                    <Switch
                        value={isGraded}
                        onValueChange={onChangeGraded}
                        trackColor={{ false: theme.border, true: theme.primary }}
                    />
                </View>

                {isGraded && (
                    <View style={{ marginBottom: 12 }}>
                        <Text style={[sheetStyles.label, { color: theme.mutedText, fontSize: 12 }]}>Grading Company</Text>
                        {renderChoices(GRADING_COMPANIES, gradingCompany as typeof GRADING_COMPANIES[number] | null, onChangeGradingCompany)}
                        <Text style={[sheetStyles.label, { color: theme.mutedText, fontSize: 12, marginTop: 10 }]}>Grade</Text>
                        {renderChoices(GRADES, grade as typeof GRADES[number] | null, onChangeGrade)}
                    </View>
                )}

                {market.price !== null && (
                    <View style={[styles.marketPriceBanner, { backgroundColor: theme.primary + '1A' }]}>
                        <Ionicons name="trending-up" size={16} color={theme.primary} />
                        <Text style={{ flex: 1, fontSize: 14, color: theme.text }}>
                            Current {market.source ?? 'MKT'} Market Price:{' '}
                            <Text style={{ fontWeight: 'bold' }}>{formatUsd(convertToUsd(market.price, market.currency))}</Text>
                        </Text>
                    </View>
                )}

                <View style={sheetStyles.row}>
                    <View style={sheetStyles.halfCol}>
                        <Text style={[sheetStyles.label, { color: theme.text }]}>
                            Quantity <Text style={{ fontWeight: 'normal', color: theme.mutedText }}>(This Row)</Text>
                        </Text>
                        <TextInput style={inputStyle} value={quantity} onChangeText={onChangeQuantity} keyboardType="number-pad" />
                    </View>
                    <View style={sheetStyles.halfCol}>
                        <Text style={[sheetStyles.label, { color: theme.text }]}>Listing Price ($)</Text>
                        <TextInput style={inputStyle} value={listingPrice} onChangeText={onChangeListingPrice} keyboardType="decimal-pad" />
                    </View>
                </View>
                <View style={sheetStyles.row}>
                    <View style={sheetStyles.halfCol} />
                    <View style={sheetStyles.halfCol}>
                        <Text style={[sheetStyles.label, { color: theme.text }]}>
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
                    </View>
                </View>

                <Text style={[sheetStyles.label, { color: theme.text }]}>Status</Text>
                {renderChoices(allowedStatuses, status, onChangeStatus)}

                {status === 'SOLD' && (
                    <View style={[styles.soldContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[sheetStyles.label, { color: theme.text }]}>Sale Details</Text>
                        <View style={sheetStyles.row}>
                            <View style={sheetStyles.halfCol}>
                                <Text style={[sheetStyles.label, { color: theme.mutedText, fontSize: 12 }]}>Sold Price ($)</Text>
                                <TextInput
                                    style={[inputStyle, { backgroundColor: theme.background }]}
                                    value={soldPrice}
                                    onChangeText={onChangeSoldPrice}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    style={[sheetStyles.saveButton, { backgroundColor: theme.primary, marginTop: 30, marginBottom: isEditing ? 16 : 40, opacity: saving ? 0.6 : 1 }]}
                    onPress={onSave}
                    disabled={saving}
                    accessibilityRole="button"
                >
                    <Text style={sheetStyles.saveButtonText}>
                        {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add to Inventory'}
                    </Text>
                </TouchableOpacity>

                {isEditing && (
                    <TouchableOpacity
                        style={[sheetStyles.saveButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.destructive }]}
                        onPress={onDelete}
                        disabled={saving}
                        accessibilityRole="button"
                    >
                        <Text style={[sheetStyles.saveButtonText, { color: theme.destructive }]}>Delete item</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </ModalShell>
    );
}

const styles = StyleSheet.create({
    collectionBanner: {
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroImage: {
        width: 150,
        height: 210,
        borderRadius: 8,
    },
    marketPriceBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 6,
    },
    soldContainer: {
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
});
