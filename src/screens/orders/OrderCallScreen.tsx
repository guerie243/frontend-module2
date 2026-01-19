/**
 * Order Call Screen
 * 
 * Communication screen for calling/messaging client
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAlertService } from '../../utils/alertService';

export const OrderCallScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { showError } = useAlertService();

    const { clientName, clientPhone, orderId } = route.params || {};

    const handlePhoneCall = () => {
        const phoneUrl = `tel:${clientPhone}`;
        console.log('Initiating phone call to:', clientPhone);

        Linking.canOpenURL(phoneUrl)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(phoneUrl);
                } else {
                    showError('Impossible d\'ouvrir l\'application téléphone');
                }
            })
            .catch((err) => {
                console.error('Error opening phone:', err);
                showError('Erreur lors de l\'appel');
            });
    };

    const handleWhatsApp = () => {
        const message = `Bonjour ${clientName}, je vous contacte concernant votre commande #${orderId?.slice(-6)}.`;
        const whatsappUrl = Platform.select({
            ios: `whatsapp://send?phone=${clientPhone}&text=${encodeURIComponent(message)}`,
            android: `whatsapp://send?phone=${clientPhone}&text=${encodeURIComponent(message)}`,
            default: `https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`,
        });

        console.log('Opening WhatsApp for:', clientPhone);

        Linking.canOpenURL(whatsappUrl)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(whatsappUrl);
                } else {
                    showError('WhatsApp n\'est pas installé');
                }
            })
            .catch((err) => {
                console.error('Error opening WhatsApp:', err);
                showError('Erreur lors de l\'ouverture de WhatsApp');
            });
    };

    const handleSMS = () => {
        const message = `Bonjour ${clientName}, je vous contacte concernant votre commande #${orderId?.slice(-6)}.`;
        const smsUrl = Platform.select({
            ios: `sms:${clientPhone}&body=${encodeURIComponent(message)}`,
            android: `sms:${clientPhone}?body=${encodeURIComponent(message)}`,
            default: `sms:${clientPhone}`,
        });

        console.log('Opening SMS for:', clientPhone);

        Linking.canOpenURL(smsUrl)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(smsUrl);
                } else {
                    showError('Impossible d\'ouvrir l\'application SMS');
                }
            })
            .catch((err) => {
                console.error('Error opening SMS:', err);
                showError('Erreur lors de l\'ouverture des SMS');
            });
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    Contacter le client
                </Text>
                <Text style={[styles.clientName, { color: theme.colors.textSecondary }]}>
                    {clientName}
                </Text>
                <Text style={[styles.clientPhone, { color: theme.colors.primary }]}>
                    {clientPhone}
                </Text>
            </View>

            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#34C759' }]}
                    onPress={handlePhoneCall}
                >
                    <Text style={styles.buttonIcon}>📞</Text>
                    <Text style={styles.buttonText}>Appeler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#25D366' }]}
                    onPress={handleWhatsApp}
                >
                    <Text style={styles.buttonIcon}>💬</Text>
                    <Text style={styles.buttonText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#007AFF' }]}
                    onPress={handleSMS}
                >
                    <Text style={styles.buttonIcon}>✉️</Text>
                    <Text style={styles.buttonText}>SMS</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.backButton, { borderColor: theme.colors.border }]}
                onPress={() => navigation.goBack()}
            >
                <Text style={[styles.backButtonText, { color: theme.colors.text }]}>
                    Retour
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    clientName: {
        fontSize: 18,
        marginBottom: 4,
    },
    clientPhone: {
        fontSize: 20,
        fontWeight: '600',
    },
    buttonsContainer: {
        gap: 16,
    },
    button: {
        height: 70,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    buttonIcon: {
        fontSize: 28,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    backButton: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
