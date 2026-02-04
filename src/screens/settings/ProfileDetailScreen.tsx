/**
 * ProfileDetailScreen
 * 
 * Detailed user profile view with account deletion functionality
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Modal, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { CustomButton } from '../../components/CustomButton';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../../services/userService';
import { useAlertService } from '../../utils/alertService';

export const ProfileDetailScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { user, isAuthenticated, logout, refreshUser } = useAuth();
    const { showError, showSuccess, showConfirm } = useAlertService();

    const [refreshing, setRefreshing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await refreshUser?.();
        } catch (error) {
            console.error("Erreur de rafraîchissement:", error);
        } finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            if (refreshUser) {
                refreshUser();
            }
        }, [refreshUser])
    );

    const handleDeleteAccount = () => {
        showConfirm(
            'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et entraînera la suppression définitive de toutes vos données associées (y compris votre Vitrine et vos Produits).',
            () => setShowPasswordModal(true)
        );
    };

    const confirmDelete = async () => {
        if (!password.trim()) {
            showError('Veuillez entrer votre mot de passe.');
            return;
        }

        setShowPasswordModal(false);
        setDeleting(true);

        try {
            await userService.deleteAccount(password.trim());
            setPassword('');
            await logout();

            showSuccess('Votre compte a été supprimé avec succès.');

            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error: any) {
            console.error("Erreur suppression compte:", error);
            const errorMessage = error.response?.data?.message || "Impossible de supprimer le compte. Vérifiez votre mot de passe.";
            showError(errorMessage);
            setPassword('');
        } finally {
            setDeleting(false);
        }
    };

    const handleCancelPasswordModal = () => {
        setShowPasswordModal(false);
        setPassword('');
    };

    if (deleting) {
        return (
            <ScreenWrapper>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.error} />
                    <Text style={{ marginTop: 16, color: theme.colors.text }}>Suppression du compte en cours...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (!user || !isAuthenticated) {
        return (
            <ScreenWrapper>
                <View style={styles.center}>
                    <Text style={{ color: theme.colors.text }}>Non connecté</Text>
                    <CustomButton title="Se connecter" onPress={() => navigation.navigate('Login')} style={{ marginTop: 20 }} />
                </View>
            </ScreenWrapper>
        );
    }

    const renderDetailRow = (label: string, value: string | undefined, icon: any) => (
        <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.rowContent}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>{value || 'Non renseigné'}</Text>
            </View>
        </View>
    );

    return (
        <ScreenWrapper>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    <Text style={[styles.title, { color: theme.colors.text, flex: 1, textAlign: 'center' }]}>Mon Profil</Text>

                    <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
                    </TouchableOpacity>
                </View>

                <View style={styles.profileHeader}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={[styles.profileName, { color: theme.colors.text }]}>{user.name}</Text>
                </View>

                <View style={styles.section}>
                    {renderDetailRow('Email', user.email, 'mail-outline')}
                    {renderDetailRow('Téléphone', user.phone, 'call-outline')}
                    {renderDetailRow('Nom d\'utilisateur', user.username, 'person-outline')}
                </View>

                <CustomButton
                    title="Modifier le profil"
                    onPress={() => navigation.navigate('CompteModificationMain')}
                    style={styles.editButton}
                    variant="outline"
                />

            </ScrollView>

            {/* Modal de confirmation avec mot de passe */}
            <Modal
                visible={showPasswordModal}
                transparent
                animationType="fade"
                onRequestClose={handleCancelPasswordModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                            Confirmer la suppression
                        </Text>
                        <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
                            Entrez votre mot de passe pour confirmer la suppression définitive de votre compte.
                        </Text>

                        <TextInput
                            style={[styles.passwordInput, {
                                backgroundColor: theme.colors.background,
                                color: theme.colors.text,
                                borderColor: theme.colors.border
                            }]}
                            placeholder="Mot de passe"
                            placeholderTextColor={theme.colors.textSecondary}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                onPress={handleCancelPasswordModal}
                                style={[styles.modalButton, { backgroundColor: theme.colors.border }]}
                            >
                                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Annuler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={confirmDelete}
                                style={[styles.modalButton, styles.deleteModalButton, { backgroundColor: theme.colors.error }]}
                            >
                                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Supprimer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    content: { paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    backButton: { padding: 8 },
    deleteButton: { padding: 8, marginRight: 0 },
    title: { fontSize: 20, fontWeight: 'bold' },
    profileHeader: { alignItems: 'center', marginVertical: 24 },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 32, fontWeight: 'bold' },
    profileName: { fontSize: 24, fontWeight: 'bold' },
    section: { paddingHorizontal: 16, marginBottom: 24 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
    iconContainer: { width: 40, alignItems: 'center', marginRight: 16 },
    rowContent: { flex: 1 },
    label: { fontSize: 12, marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '500' },
    editButton: { marginHorizontal: 16, marginTop: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', maxWidth: 400, borderRadius: 12, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    modalDescription: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
    passwordInput: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
    deleteModalButton: {},
    modalButtonText: { fontSize: 16, fontWeight: '600' }
});
