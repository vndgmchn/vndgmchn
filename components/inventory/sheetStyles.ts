import { StyleSheet } from 'react-native';

// Shared by the Inventory screen's sheets and forms.
export const sheetStyles = StyleSheet.create({
    sheetBody: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    modalBody: {
        padding: 20,
    },
    sectionHeading: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 12,
    },
    filterSubHeading: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 10,
    },
    optionList: {
        gap: 8,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(127,127,127,0.25)',
    },
    optionText: {
        fontSize: 16,
    },
    filterChipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    filterChipToggle: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfCol: {
        width: '48%',
    },
    choiceGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    choiceChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
    },
    saveButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 40,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
