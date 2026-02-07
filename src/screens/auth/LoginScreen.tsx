import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useAlertService } from '../../utils/alertService';
import { useTheme } from '../../context/ThemeContext';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_IMAGES } from '../../constants/images';

export const LoginScreen = () => {
    const navigation = useNavigation<any>();
    const { login } = useAuth();
    const { showError, showSuccess } = useAlertService();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // 0: Email, 1: Phone Number
    const [loginMode, setLoginMode] = useState(0);

    const getPlaceholder = () => {
        return loginMode === 0 ? "Adresse E-mail" : "Numéro de Téléphone";
    };

    const toggleLoginMode = () => {
        setIdentifier('');
        setLoginMode((prevMode) => (prevMode === 0 ? 1 : 0));
    };

    const handleLogin = async () => {
        if (!identifier || !password) {
            showError('Veuillez remplir tous les champs');
            return;
        }

        setIsLoading(true);
        try {
            await login(identifier, password);
            showSuccess('Connexion réussie');
            navigation.replace('MainTabs');
        } catch (error: any) {
            showError(error.message || 'Échec de la connexion');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigateToRegister = () => {
        navigation.navigate('Register');
    };

    return (
        <ScreenWrapper
            scrollable
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={DEFAULT_IMAGES.logo}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={[styles.title, { color: theme.colors.text }]}>Connexion</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    Connectez-vous pour gérer vos commandes
                </Text>

                <View style={styles.form}>
                    <CustomInput
                        placeholder={getPlaceholder()}
                        value={identifier}
                        onChangeText={setIdentifier}
                        keyboardType={loginMode === 0 ? 'email-address' : 'phone-pad'}
                        autoCapitalize="none"
                    />

                    <CustomInput
                        placeholder="Mot de Passe"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!isPasswordVisible}
                        RightComponent={
                            <TouchableOpacity
                                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                style={{ padding: 8 }}
                            >
                                <Ionicons
                                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                                    size={20}
                                    color={theme.colors.textSecondary}
                                />
                            </TouchableOpacity>
                        }
                    />

                    <TouchableOpacity
                        onPress={toggleLoginMode}
                        style={styles.toggleContainer}
                    >
                        <Text style={[styles.toggleText, { color: theme.colors.primary }]}>
                            Utiliser {loginMode === 0 ? 'le téléphone' : "l'e-mail"}
                        </Text>
                    </TouchableOpacity>

                    <CustomButton
                        title="Se Connecter"
                        onPress={handleLogin}
                        isLoading={isLoading}
                        style={styles.loginButton}
                    />

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                            Pas encore de compte ?{' '}
                        </Text>
                        <TouchableOpacity onPress={handleNavigateToRegister}>
                            <Text style={[styles.link, { color: theme.colors.primary }]}>
                                S'inscrire
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScreenWrapper>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 30, // Tightened from 20
    },
    content: {
        justifyContent: 'center',
        paddingVertical: 20,
        alignItems: 'center', // Added for centering logo
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        // Elevation for Android
        elevation: 4,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.border + '40', // Subtle border
    },
    logo: {
        width: 70,
        height: 70,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 32,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    toggleContainer: {
        alignSelf: 'flex-start',
        marginTop: 4,
        marginBottom: 16,
        paddingVertical: 4,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        marginTop: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 14,
    },
    link: {
        fontSize: 14,
        fontWeight: '600',
    },
});
