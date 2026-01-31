/**
 * Settings Screen
 * 
 * User settings and profile management
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

export const SettingsScreen = () => {
    const navigation = useNavigation<any>();
    const { theme, isDark, toggleTheme } = useTheme();
    const { user, isAuthenticated, logout } = useAuth();
    const { showConfirm } = useAlertService();

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

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
                Paramètres
            </Text>

            {/* User Info */}
            {isAuthenticated && user && (
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Compte
                    </Text>
                    <Text style={[styles.userName, { color: theme.colors.text }]}>
                        {user.name}
                    </Text>
                    <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                        {user.email}
                    </Text>
                </View>
            )}

            {/* Appearance */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Apparence
                </Text>

                <TouchableOpacity
                    style={[styles.settingRow, { borderColor: theme.colors.border }]}
                    onPress={toggleTheme}
                >
                    <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                        Mode sombre
                    </Text>
                    <Text style={[styles.settingValue, { color: theme.colors.primary }]}>
                        {isDark ? 'Activé' : 'Désactivé'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Permissions */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Permissions
                </Text>

                <PermissionRow
                    label="Localisation (GPS)"
                    active={permissions.location}
                    onPress={() => handleRequestPermission('location')}
                    theme={theme}
                />
                <PermissionRow
                    label="Caméra"
                    active={permissions.camera}
                    onPress={() => handleRequestPermission('camera')}
                    theme={theme}
                />
                <PermissionRow
                    label="Photos"
                    active={permissions.photos}
                    onPress={() => handleRequestPermission('photos')}
                    theme={theme}
                />
                <PermissionRow
                    label="Notifications"
                    active={permissions.notifications}
                    onPress={() => handleRequestPermission('notifications')}
                    theme={theme}
                />
            </View>

            {/* Account Actions */}
            {
                isAuthenticated ? (
                    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.colors.error }]}
                            onPress={handleLogout}
                        >
                            <Text style={styles.buttonText}>Se déconnecter</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.colors.primary }]}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.buttonText}>Se connecter</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, {
                                backgroundColor: 'transparent',
                                borderWidth: 1,
                                borderColor: theme.colors.primary
                            }]}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
                                Créer un compte
                            </Text>
                        </TouchableOpacity>
                    </View>
                )
            }

            {/* App Info */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    À propos
                </Text>
                <Text style={[styles.appVersion, { color: theme.colors.textSecondary }]}>
                    Version 1.0.0
                </Text>
            </View>
        </ScrollView >
    );
};

const PermissionRow = ({ label, active, onPress, theme }: any) => (
    <TouchableOpacity
        style={[styles.settingRow, { borderColor: theme.colors.border }]}
        onPress={onPress}
        disabled={active}
    >
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
            {label}
        </Text>
        <Text style={[styles.settingValue, { color: active ? theme.colors.success || '#4CAF50' : theme.colors.primary }]}>
            {active ? 'Autorisé' : 'Demander'}
        </Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        padding: 16,
    },
    section: {
        padding: 16,
        margin: 16,
        marginTop: 0,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    settingLabel: {
        fontSize: 16,
    },
    settingValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    appVersion: {
        fontSize: 14,
        textAlign: 'center',
    },
});
