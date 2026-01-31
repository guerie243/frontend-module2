/**
 * Alert Modal Component
 * 
 * Animated alert modal with customizable buttons
 * Adapted from Module 1
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
    Platform
} from 'react-native';
import { useAlert, AlertButton } from './AlertProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ALERT_COLORS = {
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
    confirm: '#2196F3',
};

export const AlertModal: React.FC = () => {
    const { currentAlert, hideAlert } = useAlert();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        if (currentAlert) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.ease),
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [currentAlert]);

    if (!currentAlert) return null;

    const handleButtonPress = (button: AlertButton) => {
        if (button.onPress) {
            button.onPress();
        }
        hideAlert();
    };

    const accentColor = ALERT_COLORS[currentAlert.type];

    return (
        <Modal
            visible={!!currentAlert}
            transparent
            animationType="none"
            onRequestClose={hideAlert}
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={hideAlert}
                />
                <Animated.View
                    style={[
                        styles.alertContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <View style={[styles.colorBar, { backgroundColor: accentColor }]} />

                    <View style={styles.content}>
                        {currentAlert.title ? (
                            <Text style={styles.title}>{currentAlert.title}</Text>
                        ) : null}
                        <Text style={styles.message}>{currentAlert.message}</Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        {currentAlert.buttons?.map((button, index) => {
                            const isDestructive = button.style === 'destructive';
                            const isCancel = button.style === 'cancel';

                            return (
                                <React.Fragment key={index}>
                                    {index > 0 && <View style={styles.buttonSeparator} />}
                                    <TouchableOpacity
                                        style={styles.button}
                                        onPress={() => handleButtonPress(button)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.buttonText,
                                                isDestructive && styles.buttonTextDestructive,
                                                isCancel && styles.buttonTextCancel,
                                                !isDestructive && !isCancel && { color: accentColor },
                                            ]}
                                        >
                                            {button.text}
                                        </Text>
                                    </TouchableOpacity>
                                </React.Fragment>
                            );
                        })}
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    alertContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        width: Platform.OS === 'web' ? Math.min(400, SCREEN_WIDTH - 40) : SCREEN_WIDTH - 60,
        maxWidth: 400,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    colorBar: {
        height: 4,
        width: '100%',
    },
    content: {
        padding: 20,
        paddingBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#212121',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#616161',
        lineHeight: 22,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonSeparator: {
        width: 1,
        backgroundColor: '#E0E0E0',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextDestructive: {
        color: '#F44336',
    },
    buttonTextCancel: {
        color: '#757575',
        fontWeight: '400',
    },
});
