import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAlertService } from '../utils/alertService';

interface WhatsAppButtonProps {
    phoneNumber?: string;
    message?: string;
    // ✅ Ajout d'une prop pour passer le titre du produit
    productTitle?: string;
    style?: ViewStyle;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
    phoneNumber,
    message, // Retiré la valeur par défaut ici
    productTitle, // Utilisé pour construire le message
    style
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { showError } = useAlertService();

    // ✅ LOGIQUE DE CENTRALISATION DU MESSAGE
    let finalMessage = message;
    if (!finalMessage && productTitle) {
        // Construction du message basé sur la spécificité de la page/produit
        finalMessage = `Bonjour ! Je suis intéressé par l'article: "${productTitle}". Pourriez-vous me donner plus de détails ?`;
    } else if (!finalMessage) {
        // Message par défaut si aucune information spécifique n'est fournie
        finalMessage = 'Bonjour ! Je suis intéressé par vos produits.';
    }


    const handlePress = async () => {
        if (!phoneNumber) {
            showError('Numéro de téléphone non disponible');
            return;
        }

        // Nettoie le numéro de téléphone pour ne conserver que les chiffres.
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        // ✅ Utilise finalMessage ici
        const url = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(finalMessage)}`;

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                showError('WhatsApp n\'est pas installé sur cet appareil');
            }
        } catch (err) {
            console.error('An error occurred', err);
            showError('Impossible d\'ouvrir WhatsApp');
        }
    };

    if (!phoneNumber) return null;

    return (
        <TouchableOpacity style={[styles.button, style || {}]} onPress={handlePress}>
            <Ionicons name="logo-whatsapp" size={20} color={theme.colors.white} style={styles.icon} />
            <Text style={styles.text}>WhatsApp</Text>
        </TouchableOpacity>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#25D366', // Couleur verte WhatsApp
        paddingVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
    },
    icon: {
        marginRight: theme.spacing.s,
    },
    text: {
        // Attention: Assurez-vous que theme.typography.button est bien défini
        // Sinon, utilisez des styles standards comme: 
        // fontSize: 16, 
        // fontWeight: 'bold',
        ...theme.typography.button,
        color: theme.colors.white,
    },
});
