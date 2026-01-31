/**
 * GuestPrompt - Composant d'Invitation à la Connexion
 * 
 * Composant réutilisable affiché aux utilisateurs invités lorsqu'ils tentent
 * d'effectuer une action nécessitant une authentification.
 * 
 * Utilisation :
 * - Remplacement des boutons d'action pour les invités
 * - Invitation contextuelle à se connecter
 * - Design cohérent dans toute l'application
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

interface GuestPromptProps {
    /**
     * Message personnalisé expliquant pourquoi la connexion est nécessaire
     * Exemple : "Connectez-vous pour créer votre vitrine"
     */
    message: string;

    /**
     * Texte du bouton d'action (optionnel)
     * Par défaut : "Se connecter"
     */
    actionLabel?: string;

    /**
     * Variante visuelle du prompt
     * - 'inline' : Petit message intégré dans l'interface
     * - 'card' : Carte mise en évidence (par défaut)
     */
    variant?: 'inline' | 'card';

    /**
     * Callback optionnel appelé lors du clic
     * Par défaut : Navigation vers l'écran Login
     */
    onPress?: () => void;
}

/**
 * Composant GuestPrompt
 * 
 * Affiche une invitation élégante à se connecter avec :
 * - Icône utilisateur
 * - Message contextuel
 * - Bouton d'action
 */
export const GuestPrompt: React.FC<GuestPromptProps> = ({
    message,
    actionLabel = 'Se connecter',
    variant = 'card',
    onPress,
}) => {
    const { theme } = useTheme();
    const navigation = useNavigation<any>();

    // Action par défaut : Navigation vers l'écran de connexion
    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            navigation.navigate('Login');
        }
    };

    // Style conditionnel selon la variante
    const containerStyle = variant === 'card' ? styles.cardContainer : styles.inlineContainer;

    return (
        <View style={[
            containerStyle,
            {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
            }
        ]}>
            {/* Icône utilisateur */}
            <Ionicons
                name="person-circle-outline"
                size={variant === 'card' ? 48 : 32}
                color={theme.colors.primary}
                style={styles.icon}
            />

            {/* Message contextuel */}
            <Text style={[
                variant === 'card' ? styles.cardMessage : styles.inlineMessage,
                { color: theme.colors.text }
            ]}>
                {message}
            </Text>

            {/* Bouton d'action */}
            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={handlePress}
                activeOpacity={0.8}
            >
                <Text style={[styles.buttonText, { color: theme.colors.white }]}>
                    {actionLabel}
                </Text>
                <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={theme.colors.white}
                    style={styles.buttonIcon}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    // Style pour la variante 'card' (mise en évidence)
    cardContainer: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        marginVertical: 16,
    },

    // Style pour la variante 'inline' (discret)
    inlineContainer: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },

    icon: {
        marginBottom: 12,
    },

    cardMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 22,
    },

    inlineMessage: {
        fontSize: 14,
        flex: 1,
        marginLeft: 12,
    },

    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 8,
    },

    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },

    buttonIcon: {
        marginLeft: 8,
    },
});
