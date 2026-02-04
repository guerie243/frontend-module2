/**
 * ContactUsScreen
 * 
 * Contact screen with support options
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const ContactUsScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();

    const handleEmail = () => {
        Linking.openURL('mailto:support@andybusiness.com');
    };

    const handlePhone = () => {
        Linking.openURL('tel:+243000000000');
    };

    const handleWhatsApp = () => {
        Linking.openURL('https://wa.me/243000000000');
    };

    const renderContactOption = (icon: any, label: string, value: string, onPress: () => void) => (
        <TouchableOpacity
            style={[styles.contactOption, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name={icon} size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.contactInfo}>
                <Text style={[styles.contactLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.contactValue, { color: theme.colors.text }]}>{value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Nous contacter</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Comment pouvons-nous vous aider ?</Text>

                    <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                        Notre équipe est disponible pour répondre à vos questions et vous aider. N'hésitez pas à nous contacter par l'un des moyens ci-dessous.
                    </Text>

                    <View style={styles.optionsContainer}>
                        {renderContactOption(
                            'mail-outline',
                            'Email',
                            'support@andybusiness.com',
                            handleEmail
                        )}

                        {renderContactOption(
                            'call-outline',
                            'Téléphone',
                            '+243 000 000 000',
                            handlePhone
                        )}

                        {renderContactOption(
                            'logo-whatsapp',
                            'WhatsApp',
                            '+243 000 000 000',
                            handleWhatsApp
                        )}
                    </View>

                    <View style={[styles.infoBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                            Nous répondons généralement dans les 24 heures
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    content: { padding: 16, paddingBottom: 40 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
    description: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
    optionsContainer: { gap: 12, marginBottom: 24 },
    contactOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contactInfo: { flex: 1 },
    contactLabel: { fontSize: 12, marginBottom: 4 },
    contactValue: { fontSize: 16, fontWeight: '500' },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    infoText: { flex: 1, fontSize: 14 },
});
