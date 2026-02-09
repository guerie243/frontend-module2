import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

interface LocationCaptureModalProps {
    visible: boolean;
    accuracy: number | null;
    status: 'scanning' | 'success' | 'timeout' | 'error' | 'permission_denied';
    onRetry: () => void;
    onCancel?: () => void;
    onManualSelect?: () => void; // Option for manual selection if GPS fails
}

const { width } = Dimensions.get('window');

export const LocationCaptureModal: React.FC<LocationCaptureModalProps> = ({
    visible,
    accuracy,
    status,
    onRetry,
    onCancel,
    onManualSelect
}) => {
    const { theme } = useTheme();
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (visible && status === 'scanning') {
            setElapsedTime(0);
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [visible, status]);

    const getAccuracyColor = (acc: number | null) => {
        if (!acc) return theme.colors.textSecondary;
        if (acc <= 50) return '#34C759'; // Excellent
        if (acc <= 150) return '#FFCC00'; // Good
        if (acc <= 300) return '#FF9500'; // Acceptable
        return '#FF3B30'; // Poor
    };

    const getStatusMessage = () => {
        switch (status) {
            case 'scanning':
                return 'Recherche de votre position précise...';
            case 'success':
                return 'Position précise trouvée !';
            case 'timeout':
                return 'Impossible d\'obtenir une position précise.';
            case 'error':
                return 'Erreur de localisation.';
            case 'permission_denied':
                return 'Permission de localisation refusée.';
            default:
                return 'Chargement...';
        }
    };

    const getHintMessage = () => {
        if (status === 'timeout' || (status === 'scanning' && elapsedTime > 5)) {
            if (accuracy && accuracy > 300) {
                return "⚠️ Votre position est trop imprécise.\n\nConseils :\n• Déplacez-vous vers une zone dégagée (extérieur).\n• Activez le WiFi pour améliorer la précision.\n• Évitez les sous-sols ou bâtiments fermés.";
            }
            if (!accuracy) {
                return "⚠️ Aucun signal GPS détecté.\n\nAssurez-vous d'être à l'extérieur ou près d'une fenêtre.";
            }
        }
        return null;
    };


    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                {/* Blur Background if possible, else semi-transparent */}
                <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />

                <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.iconContainer}>
                        {status === 'scanning' ? (
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        ) : status === 'success' ? (
                            <Ionicons name="checkmark-circle" size={50} color="#34C759" />
                        ) : (
                            <Ionicons name="warning" size={50} color="#FF3B30" />
                        )}
                    </View>

                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        {getStatusMessage()}
                    </Text>

                    {status === 'scanning' && (
                        <View style={styles.accuracyContainer}>
                            <Text style={[styles.accuracyLabel, { color: theme.colors.textSecondary }]}>
                                Précision actuelle :
                            </Text>
                            <Text style={[styles.accuracyValue, { color: getAccuracyColor(accuracy) }]}>
                                {accuracy ? `± ${Math.round(accuracy)} m` : '--'}
                            </Text>
                            <Text style={[styles.targetText, { color: theme.colors.textTertiary }]}>
                                Objectif : ≤ 300 m
                            </Text>
                        </View>
                    )}

                    {getHintMessage() && (
                        <View style={[styles.hintContainer, { backgroundColor: theme.colors.background }]}>
                            <Text style={[styles.hintText, { color: theme.colors.text }]}>
                                {getHintMessage()}
                            </Text>
                        </View>
                    )}

                    <View style={styles.actions}>
                        {(status === 'timeout' || status === 'error' || status === 'permission_denied') && (
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                                onPress={onRetry}
                            >
                                <Ionicons name="refresh" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.buttonText}>Réessayer</Text>
                            </TouchableOpacity>
                        )}

                        {(status === 'timeout' || status === 'error') && onManualSelect && (
                            <TouchableOpacity
                                style={[styles.textButton, { marginTop: 12 }]}
                                onPress={onManualSelect}
                            >
                                <Text style={[styles.textButtonLabel, { color: theme.colors.primary }]}>
                                    Sélectionner manuellement sur la carte
                                </Text>
                            </TouchableOpacity>
                        )}

                        {onCancel && (
                            <TouchableOpacity
                                style={[styles.textButton, { marginTop: 12 }]}
                                onPress={onCancel}
                            >
                                <Text style={[styles.textButtonLabel, { color: theme.colors.textSecondary }]}>
                                    Annuler
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    accuracyContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    accuracyLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    accuracyValue: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    targetText: {
        fontSize: 12,
    },
    hintContainer: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        width: '100%',
    },
    hintText: {
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'left',
    },
    actions: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        flexDirection: 'row',
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 20,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    textButton: {
        padding: 8,
    },
    textButtonLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
});
