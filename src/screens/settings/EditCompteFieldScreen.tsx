/**
 * EditCompteFieldScreen
 * 
 * Screen for editing individual account fields
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../../services/userService';
import { useAlertService } from '../../utils/alertService';
import { useAuth } from '../../hooks/useAuth';

export const EditCompteFieldScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { showError, showSuccess } = useAlertService();
    const { refreshUser } = useAuth();

    const { field, label, currentValue, editable = true, ...options } = route.params || {};

    const [value, setValue] = useState(currentValue || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!editable) {
            showError('Ce champ ne peut pas être modifié.');
            return;
        }

        // Validation pour le mot de passe
        if (field === 'password') {
            if (!currentPassword.trim()) {
                showError('Veuillez entrer votre mot de passe actuel.');
                return;
            }
            if (!newPassword.trim()) {
                showError('Veuillez entrer un nouveau mot de passe.');
                return;
            }
            if (newPassword !== confirmPassword) {
                showError('Les mots de passe ne correspondent pas.');
                return;
            }
            if (newPassword.length < 6) {
                showError('Le mot de passe doit contenir au moins 6 caractères.');
                return;
            }
        } else {
            if (!value.trim()) {
                showError(`Le champ ${label} ne peut pas être vide.`);
                return;
            }
        }

        setLoading(true);

        try {
            const updateData: any = {};

            if (field === 'password') {
                updateData.oldPassword = currentPassword.trim();
                updateData.password = newPassword.trim();
            } else {
                updateData[field] = value.trim();
            }

            await userService.updateProfile(updateData);

            if (refreshUser) {
                await refreshUser();
            }

            showSuccess(`${label} mis à jour avec succès.`);
            navigation.navigate('CompteModificationMain', { refreshed: true });
        } catch (error: any) {
            console.error(`Erreur mise à jour ${field}:`, error);
            const errorMessage = error.response?.data?.message || `Impossible de mettre à jour ${label}.`;
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{label}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.content}>
                    {field === 'password' ? (
                        <>
                            <CustomInput
                                label="Mot de passe actuel"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                                placeholder="Entrez votre mot de passe actuel"
                                editable={!loading}
                            />
                            <CustomInput
                                label="Nouveau mot de passe"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                placeholder="Entrez votre nouveau mot de passe"
                                editable={!loading}
                            />
                            <CustomInput
                                label="Confirmer le nouveau mot de passe"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                placeholder="Confirmez votre nouveau mot de passe"
                                editable={!loading}
                            />
                        </>
                    ) : (
                        <CustomInput
                            label={label}
                            value={value}
                            onChangeText={setValue}
                            placeholder={`Entrez votre ${label.toLowerCase()}`}
                            editable={editable && !loading}
                            {...options}
                        />
                    )}

                    <CustomButton
                        title={loading ? "Enregistrement..." : "Enregistrer"}
                        onPress={handleSave}
                        style={styles.saveButton}
                        disabled={loading || !editable}
                    />

                    {!editable && (
                        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                            Ce champ ne peut pas être modifié.
                        </Text>
                    )}
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    saveButton: { marginTop: 24 },
    infoText: { marginTop: 16, fontSize: 14, textAlign: 'center', fontStyle: 'italic' },
});
