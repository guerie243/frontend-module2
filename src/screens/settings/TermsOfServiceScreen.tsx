/**
 * TermsOfServiceScreen
 * 
 * Terms of Service screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const TermsOfServiceScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Conditions d'utilisation</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Conditions Générales d'Utilisation</Text>

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>1. Acceptation des conditions</Text>
                    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
                        En accédant et en utilisant cette application, vous acceptez d'être lié par ces conditions d'utilisation et toutes les lois et réglementations applicables.
                    </Text>

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>2. Utilisation de l'application</Text>
                    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
                        Vous vous engagez à utiliser l'application de manière responsable et conforme aux lois en vigueur. Toute utilisation abusive ou frauduleuse peut entraîner la suspension ou la résiliation de votre compte.
                    </Text>

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>3. Compte utilisateur</Text>
                    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
                        Vous êtes responsable de maintenir la confidentialité de vos informations de compte et de toutes les activités qui se produisent sous votre compte.
                    </Text>

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>4. Propriété intellectuelle</Text>
                    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
                        Tout le contenu de l'application, y compris les textes, graphiques, logos et logiciels, est la propriété de l'application et est protégé par les lois sur la propriété intellectuelle.
                    </Text>

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>5. Limitation de responsabilité</Text>
                    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
                        L'application est fournie "en l'état" sans garantie d'aucune sorte. Nous ne serons pas responsables des dommages directs ou indirects résultant de l'utilisation de l'application.
                    </Text>

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>6. Modifications</Text>
                    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
                        Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication dans l'application.
                    </Text>

                    <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>
                        Dernière mise à jour : Février 2026
                    </Text>
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
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
    paragraph: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
    lastUpdated: { fontSize: 14, fontStyle: 'italic', marginTop: 24, textAlign: 'center' },
});
