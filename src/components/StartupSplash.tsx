import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, Image, Animated, Easing } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

/**
 * LOGO_ASSET - Import direct
 */
const LOGO_ASSET = require('../../assets/images/logo_andy.png');

/**
 * StartupSplash - Version Ultra-Robuste pour Andy Business
 */
export const StartupSplash = () => {
    const [scale] = useState(new Animated.Value(1));
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        console.log('[StartupSplash] Montage du composant');

        // 1. On affiche le logo JS tout de suite
        setVisible(true);

        // 2. On attend un peu avant de cacher le splash natif pour éviter le "trou" blanc
        const timerHide = setTimeout(() => {
            console.log('[StartupSplash] Effacement du splash natif');
            SplashScreen.hideAsync().catch(() => { });
        }, 500);

        // 3. Animation de pulsation avec Animated
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.08,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        pulse.start();

        return () => {
            clearTimeout(timerHide);
            pulse.stop();
        };
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <Animated.View style={{ transform: [{ scale }] }}>
                <View style={styles.logoWrapper}>
                    <Image
                        source={LOGO_ASSET}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    logoWrapper: {
        width: 240,
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
});

export default StartupSplash;
