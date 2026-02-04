/**
 * Settings Screen
 * 
 * User settings and profile management with collapsible sections
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useAlertService } from '../../utils/alertService';
import { PermissionService, PermissionType } from '../../utils/permissionService';
import { userService } from '../../services/userService';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GuestPrompt } from '../../components/GuestPrompt';
import { CollapsibleSection } from '../../components/CollapsibleSection';
import { CustomButton } from '../../components/CustomButton';

export const SettingsScreen = () => {
    const navigation = useNavigation<any>();
    const { theme, isDark, toggleTheme } = useTheme();
    const { user, isAuthenticated, logout } = useAuth();
    const { showConfirm } = useAlertService();
    const isGuest = !isAuthenticated;

    const [permissions, setPermissions] = React.useState({
        location: false,
        camera: false,
        photos: false,
        notifications: false,
    });

    React.useEffect(() => {
        checkAllPermissions();
    }, []);

    const checkAllPermissions = async () => {
        const statuses = {
            location: await PermissionService.getPermissionStatus('location'),
            camera: await PermissionService.getPermissionStatus('camera'),
            photos: await PermissionService.getPermissionStatus('photos'),
            notifications: await PermissionService.getPermissionStatus('notifications'),
        };
        setPermissions(statuses);
    };

    const handleRequestPermission = async (type: PermissionType) => {
        let success = false;
        switch (type) {
            case 'location': success = await PermissionService.requestLocationPermission(); break;
            case 'camera': success = await PermissionService.requestCameraPermission(); break;
            case 'photos': success = await PermissionService.requestMediaLibraryPermission(); break;
            case 'notifications': success = await PermissionService.requestNotificationsPermission(); break;
        }

        if (success) {
            checkAllPermissions();

            // Synchroniser le token avec le backend si c'est les notifications
            if (type === 'notifications' && isAuthenticated) {
                const token = await PermissionService.getNotificationToken();
                if (token) {
                    try {
                        await userService.updateTokens(
                            Platform.OS !== 'web' ? token : undefined,
                            Platform.OS === 'web' ? token : undefined
                        );
                        console.log('Notification tokens updated on backend');
                    } catch (err) {
                        console.error('Failed to sync tokens with backend', err);
                    }
                }
            }
        }
    };

    const handleLogout = () => {
        showConfirm(
            'Voulez-vous vraiment vous déconnecter ?',
            async () => {
                await logout();
                console.log('User logged out');
            }
        );
    };

    const renderSectionHeader = (title: string) => (
        <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>{title}</Text>
    );

    const renderItem = (label: string, onPress?: () => void, rightElement?: React.ReactNode, icon?: any) => (
        <TouchableOpacity
            style={[styles.item, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.itemLeft}>
                {icon && <Ionicons name={icon} size={20} color={theme.colors.text} style={styles.itemIcon} />}
                <Text style={[styles.itemLabel, { color: theme.colors.text }]}>{label}</Text>
            </View>
            {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />)}
        </TouchableOpacity>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Paramètres</Text>

            {/* SECTION COMPTE - Visible uniquement pour authentifiés */}
            {isAuthenticated && (
                <>
                    {/* Profile Card */}
                    <TouchableOpacity
                        style={styles.profileCard}
                        onPress={() => navigation.navigate('ProfileDetail')}
                    >
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>
                                {user?.name || 'Utilisateur'}
                            </Text>
                            <Text style={styles.profileEmail}>
                                {user?.email || 'email@example.com'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    {renderSectionHeader('COMPTE')}
                </>
            )}

            {/* GUEST PROMPT - Visible uniquement pour invités */}
            {isGuest && (
                <>
                    {renderSectionHeader('COMPTE')}
                    <GuestPrompt
                        message="Connectez-vous pour accéder à votre profil et gérer vos vitrines"
                        variant="card"
                    />
                </>
            )}

            {/* SECTION PRÉFÉRENCES - Visible pour tous */}
            {renderSectionHeader('PRÉFÉRENCES')}
            {renderItem(
                'Mode sombre',
                toggleTheme,
                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                    {isDark ? 'Activé' : 'Désactivé'}
                </Text>,
                'moon-outline'
            )}

            {/* SECTION AUTORISATIONS - Dans CollapsibleSection */}
            {renderSectionHeader('AUTORISATIONS')}
            <CollapsibleSection title="Gérer les autorisations" defaultOpen={false} theme={theme}>
                <PermissionRow
                    label="Localisation (GPS)"
                    active={permissions.location}
                    onPress={() => handleRequestPermission('location')}
                    theme={theme}
                    icon="location-outline"
                />
                <PermissionRow
                    label="Caméra"
                    active={permissions.camera}
                    onPress={() => handleRequestPermission('camera')}
                    theme={theme}
                    icon="camera-outline"
                />
                <PermissionRow
                    label="Photos"
                    active={permissions.photos}
                    onPress={() => handleRequestPermission('photos')}
                    theme={theme}
                    icon="images-outline"
                />
                <PermissionRow
                    label="Notifications"
                    active={permissions.notifications}
                    onPress={() => handleRequestPermission('notifications')}
                    theme={theme}
                    icon="notifications-outline"
                />
            </CollapsibleSection>

            {/* SECTION LÉGAL & INFO - Visible pour tous */}
            {renderSectionHeader('LÉGAL & INFO')}
            {renderItem('Conditions d\'utilisation', () => navigation.navigate('TermsOfService'), null, 'document-text-outline')}
            {renderItem('Politique de confidentialité', () => navigation.navigate('PrivacyPolicy'), null, 'shield-checkmark-outline')}
            {renderItem('Nous contacter', () => navigation.navigate('ContactUs'), null, 'mail-outline')}
            {renderItem(
                'À propos',
                () => { },
                <Text style={{ color: theme.colors.textSecondary }}>v1.0.0</Text>,
                'information-circle-outline'
            )}

            {/* BOUTON DÉCONNEXION - Visible uniquement pour authentifiés */}
            {isAuthenticated && (
                <View style={styles.logoutContainer}>
                    <CustomButton
                        title="Se déconnecter"
                        onPress={handleLogout}
                        variant="danger"
                        style={styles.logoutButton}
                    />
                </View>
            )}
        </ScrollView>
    );
};

const PermissionRow = ({ label, active, onPress, theme, icon }: any) => (
    <TouchableOpacity
        style={[styles.permissionRow, { borderBottomColor: theme.colors.border }]}
        onPress={onPress}
        disabled={active}
    >
        <View style={styles.permissionLeft}>
            <Ionicons name={icon} size={20} color={theme.colors.text} style={styles.permissionIcon} />
            <Text style={[styles.permissionLabel, { color: theme.colors.text }]}>
                {label}
            </Text>
        </View>
        <Text style={[styles.permissionValue, { color: active ? theme.colors.success || '#4CAF50' : theme.colors.primary }]}>
            {active ? 'Autorisé' : 'Demander'}
        </Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 24,
        padding: 16,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 8,
        borderWidth: 1,
        backgroundColor: '#007AFF',
        borderColor: 'transparent',
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
        color: '#FFFFFF',
    },
    profileEmail: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
        marginLeft: 20,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        marginHorizontal: 16,
        borderWidth: 1,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemIcon: {
        marginRight: 12,
    },
    itemLabel: {
        fontSize: 16,
    },
    permissionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    permissionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    permissionIcon: {
        marginRight: 12,
    },
    permissionLabel: {
        fontSize: 16,
    },
    permissionValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    logoutContainer: {
        marginTop: 32,
        marginHorizontal: 16,
        marginBottom: 40,
    },
    logoutButton: {
        width: '100%',
    },
});
