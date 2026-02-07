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

export const RegisterScreen = () => {
    const navigation = useNavigation<any>();
    const { register } = useAuth();
    const { showError, showSuccess } = useAlertService();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [step, setStep] = useState(1);
    const [loginMode, setLoginMode] = useState(0); // 0: Email, 1: Phone
    const [profileName, setProfileName] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const getPasswordError = useMemo(() => {
        if (!password) return undefined;
        if (password.length < 8) return '8 caractères minimum';
        if (!/[A-Z]/.test(password)) return 'Une majuscule requise';
        if (!/[a-z]/.test(password)) return 'Une minuscule requise';
        if (!/\d/.test(password)) return 'Un chiffre requis';
        return undefined;
    }, [password]);

    const isPasswordValid = !getPasswordError && password.length >= 8;
    const confirmPasswordError = confirmPassword && password !== confirmPassword ? 'Les mots de passe ne correspondent pas' : undefined;

    const toggleLoginMode = () => {
        setIdentifier('');
        setLoginMode((prev) => (prev === 0 ? 1 : 0));
    };

    const handleNext = () => {
        if (!profileName || !identifier) {
            showError('Veuillez remplir tous les champs');
            return;
        }
        if (loginMode === 0 && !identifier.includes('@')) {
            showError('Email invalide');
            return;
        }
        setStep(2);
    };

    const handleRegister = async () => {
        if (!password || !confirmPassword) {
            showError('Veuillez remplir les mots de passe');
            return;
        }

        if (!isPasswordValid) {
            showError('Le mot de passe ne respecte pas les règles de sécurité');
            return;
        }

        if (password !== confirmPassword) {
            showError('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);
        try {
            await register({
                profileName,
                email: loginMode === 0 ? identifier : undefined,
                phoneNumber: loginMode === 1 ? identifier : undefined,
                password,
            });
            showSuccess('Inscription réussie');
            navigation.replace('MainTabs');
        } catch (error: any) {
            showError(error.message || 'Échec de l\'inscription');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepIndicators = () => (
        <View style={styles.indicatorContainer}>
            <View style={[styles.indicator, step >= 1 ? styles.indicatorActive : styles.indicatorInactive]} />
            <View style={[styles.indicator, step >= 2 ? styles.indicatorActive : styles.indicatorInactive]} />
        </View>
    );

    return (
        <ScreenWrapper
            scrollable
            contentContainerStyle={styles.scrollContent}
        >
            {step === 2 && (
                <TouchableOpacity
                    style={styles.backArrow}
                    onPress={() => setStep(1)}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            )}
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={DEFAULT_IMAGES.logo}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={[styles.title, { color: theme.colors.text }]}>Inscription</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    {step === 1 ? 'Vos informations de base' : 'Sécurisez votre compte'}
                </Text>

                {renderStepIndicators()}

                <View style={styles.form}>
                    {step === 1 ? (
                        <>
                            <CustomInput
                                placeholder="Nom complet *"
                                value={profileName}
                                onChangeText={setProfileName}
                                autoCapitalize="words"
                            />

                            <CustomInput
                                placeholder={loginMode === 0 ? "E-mail *" : "Téléphone *"}
                                value={identifier}
                                onChangeText={setIdentifier}
                                keyboardType={loginMode === 0 ? 'email-address' : 'phone-pad'}
                                autoCapitalize="none"
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
                                title="Suivant"
                                onPress={handleNext}
                                style={styles.button}
                            />
                        </>
                    ) : (
                        <>
                            <CustomInput
                                placeholder="Mot de passe *"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!isPasswordVisible}
                                error={getPasswordError}
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

                            <CustomInput
                                placeholder="Confirmer le mot de passe *"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!isConfirmPasswordVisible}
                                error={confirmPasswordError}
                                RightComponent={
                                    <TouchableOpacity
                                        onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                                        style={{ padding: 8 }}
                                    >
                                        <Ionicons
                                            name={isConfirmPasswordVisible ? 'eye-off' : 'eye'}
                                            size={20}
                                            color={theme.colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                }
                            />

                            <CustomButton
                                title="S'inscrire"
                                onPress={handleRegister}
                                isLoading={isLoading}
                                disabled={!isPasswordValid || password !== confirmPassword}
                                style={styles.button}
                            />
                        </>
                    )}

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                            Déjà un compte ?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={[styles.link, { color: theme.colors.primary }]}>
                                Se connecter
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
        paddingHorizontal: 30, // Consistently 30 for all auth screens
    },
    content: {
        justifyContent: 'center',
        paddingVertical: 20,
        alignItems: 'center', // Centering
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.border + '40',
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
        marginBottom: 20, // Reduced from 24
        textAlign: 'center',
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24, // Reduced from 32
    },
    indicator: {
        height: 4,
        width: 60,
        borderRadius: 2,
        marginHorizontal: 4,
    },
    indicatorActive: {
        backgroundColor: theme.colors.primary,
    },
    indicatorInactive: {
        backgroundColor: theme.colors.border,
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
    backArrow: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    button: {
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
