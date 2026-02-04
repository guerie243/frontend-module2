/**
 * PrivacyPolicyScreen
 * 
 * Privacy Policy screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const PrivacyPolicyScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Politique de confidentialité</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Politique de Confidentialité</Text>

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>1. Collecte des informations</Text>
                    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
                        Nous collectons des informations lorsque vous vous inscrivez sur notre application, passez une commande ou remplissez un formulaire. Les informations collectées incluent votre nom, adresse email, numéro de téléphone et autres informations pertinentes.
                    </Text>

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>2. Utilisation des informations</Text>
                    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
                        Les informations que nous collectons peuvent être utilisées pour :
                        {'\n'}• Personnaliser votre expérience
                        {'\n'}• Améliorer notre application
                        {'\n'}• Traiter vos transactions
                        {'\n'}• Envoyer des notifications importantes
                        {'\n'}• Améliorer le service client
                    </Text>

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>3. Protection des informations</Text>
                    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
                        Nous mettons en œuvre diverses mesures de sécurité pour préserver la sécurité de vos informations personnelles. Nous utilisons un cryptage avancé pour protéger les informations sensibles transmises en ligne.
                    </Text>

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>4. Partage des informations</Text>
                    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
                        Nous ne vendons, n'échangeons et ne transférons pas vos informations personnelles identifiables à des tiers sans votre consentement, sauf pour les partenaires de confiance qui nous aident à exploiter notre application.
                    </Text>

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>5. Cookies</Text>
                    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
                        Nous utilisons des cookies pour améliorer votre expérience sur notre application. Vous pouvez choisir de désactiver les cookies dans les paramètres de votre navigateur.
                    </Text>

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>6. Vos droits</Text>
                    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
                        Vous avez le droit d'accéder, de corriger ou de supprimer vos informations personnelles à tout moment. Pour exercer ces droits, veuillez nous contacter via l'écran "Nous contacter".
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
