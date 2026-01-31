import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAlertService } from '../utils/alertService';
import { copyToClipboard, openShareDialog } from '../utils/sharingUtils';

interface ShareMenuModalProps {
    isVisible: boolean;
    onClose: () => void;
    url: string;
    title: string;
    message: string;
}

export const ShareMenuModal: React.FC<ShareMenuModalProps> = ({
    isVisible,
    onClose,
    url,
    title,
    message,
}) => {
    const { theme } = useTheme();
    const { showToast } = useAlertService();

    const handleCopyLink = () => {
        copyToClipboard(url);
        showToast('Lien copié dans le presse-papiers');
        onClose();
    };

    const handleNativeShare = async () => {
        await openShareDialog(title, message, url);
        onClose();
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.menuContainer, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.header}>
                                <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
                                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Partager</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={handleCopyLink}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                                    <Ionicons name="copy-outline" size={22} color={theme.colors.primary} />
                                </View>
                                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Copier le lien</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={handleNativeShare}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                                    <Ionicons name="share-social-outline" size={22} color={theme.colors.primary} />
                                </View>
                                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Partager via...</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    menuContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingTop: 12,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        marginTop: 12,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});
