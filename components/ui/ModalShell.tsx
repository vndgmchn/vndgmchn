import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import {
    Modal,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    ViewStyle,
    StyleProp
} from 'react-native';

type Props = {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    /** Defines the container visual style */
    type?: 'bottom-sheet' | 'page-sheet' | 'center';
    /** Optional secondary header action (rendered to the left of the close button) */
    headerRight?: ReactNode;
    /** Hide the default close X button */
    hideClose?: boolean;
    /** Apply KeyboardAvoidingView wrapper */
    useKeyboardAvoiding?: boolean;
    /** Container style overrides */
    style?: ViewStyle;
};

export default function ModalShell({
    visible,
    onClose,
    title,
    children,
    type = 'bottom-sheet',
    headerRight,
    hideClose,
    useKeyboardAvoiding,
    style,
}: Props) {
    const theme = useThemeColors();

    const isPageSheet = type === 'page-sheet';
    const isCenter = type === 'center';

    const renderHeader = () => {
        if (!title && !headerRight && hideClose) return null;
        
        return (
            <View style={styles.header}>
                {title ? <Text style={[styles.title, { color: theme.text }]}>{title}</Text> : <View style={{ flex: 1 }} />}
                
                <View style={styles.headerActions}>
                    {headerRight}
                    {!hideClose && (
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, title || headerRight ? { marginLeft: 16 } : null]}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    let containerStyle: StyleProp<ViewStyle>;
    if (isPageSheet) {
        containerStyle = [styles.pageSheetContainer, { backgroundColor: theme.background }, style];
    } else if (isCenter) {
        containerStyle = [styles.centerContainer, { backgroundColor: theme.surface }, style];
    } else {
        containerStyle = [styles.bottomSheetContainer, { backgroundColor: theme.surface }, style];
    }

    const innerContent = (
        <View style={containerStyle}>
            {renderHeader()}
            {children}
        </View>
    );

    const overlayContent = isPageSheet ? (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            {innerContent}
        </View>
    ) : (
        <View style={[styles.overlay, isCenter ? { justifyContent: 'center' } : { justifyContent: 'flex-end' }]}>
            <TouchableWithoutFeedback onPress={onClose}>
                 <View style={StyleSheet.absoluteFillObject} />
            </TouchableWithoutFeedback>
            {innerContent}
        </View>
    );

    const avoidedContent = useKeyboardAvoiding ? (
         <KeyboardAvoidingView
             style={{ flex: 1 }}
             behavior={Platform.OS === 'ios' ? 'padding' : undefined}
         >
             {overlayContent}
         </KeyboardAvoidingView>
    ) : (
         <View style={{ flex: 1 }}>
             {overlayContent}
         </View>
    );

    return (
        <Modal
            visible={visible}
            animationType={isCenter ? 'fade' : 'slide'}
            transparent={!isPageSheet}
            presentationStyle={isPageSheet ? 'pageSheet' : undefined}
            onRequestClose={onClose}
        >
            {avoidedContent}
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    pageSheetContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 20 : 40,
    },
    centerContainer: {
        marginHorizontal: 40,
        borderRadius: 6,
        overflow: 'hidden',
        maxHeight: '80%',
    },
    bottomSheetContainer: {
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        maxHeight: '90%',
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeBtn: {
        padding: 4,
    },
});
