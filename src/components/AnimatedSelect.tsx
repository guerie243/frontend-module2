import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    FlatList,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');

interface Option {
    label: string;
    value: string;
}

interface AnimatedSelectProps {
    label?: string;
    options: Option[];
    value: string | string[];
    onChange: (value: any) => void;
    placeholder?: string;
    multiple?: boolean;
}

export const AnimatedSelect: React.FC<AnimatedSelectProps> = ({
    label,
    options,
    value,
    onChange,
    placeholder = 'Sélectionner...',
    multiple = false,
}) => {
    const { theme } = useTheme();
    const [isVisible, setIsVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const isSelected = (val: string) => {
        if (multiple && Array.isArray(value)) {
            return value.includes(val);
        }
        return value === val;
    };

    const selectedLabel = multiple && Array.isArray(value)
        ? value.length > 0
            ? `${value.length} sélectionné(s)`
            : placeholder
        : options.find((opt) => opt.value === value)?.label;

    useEffect(() => {
        if (isVisible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 250,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.cubic),
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isVisible]);

    const handleSelect = (val: string) => {
        if (multiple && Array.isArray(value)) {
            const newValue = value.includes(val)
                ? value.filter(v => v !== val)
                : [...value, val];
            onChange(newValue);
        } else {
            onChange(val);
            closeModal();
        }
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 250,
                useNativeDriver: true,
                easing: Easing.in(Easing.cubic),
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => setIsVisible(false));
    };

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>}
            <TouchableOpacity
                style={[styles.trigger, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => setIsVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.triggerText, { color: (multiple ? (Array.isArray(value) && value.length > 0) : value) ? theme.colors.text : theme.colors.textSecondary }]}>
                    {selectedLabel || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <Modal visible={isVisible} transparent animationType="none" onRequestClose={closeModal}>
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeModal}>
                        <Animated.View style={[styles.backdropFill, { opacity: fadeAnim }]} />
                    </TouchableOpacity>
                    <Animated.View
                        style={[
                            styles.sheet,
                            {
                                backgroundColor: theme.colors.background,
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        <View style={styles.header}>
                            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                                {label || placeholder}
                            </Text>
                            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            contentContainerStyle={{ paddingBottom: multiple ? 10 : 40 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.optionItem,
                                        {
                                            backgroundColor: isSelected(item.value) ? theme.colors.primary + '10' : 'transparent',
                                        },
                                    ]}
                                    onPress={() => handleSelect(item.value)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {multiple && (
                                            <View style={[
                                                styles.checkbox,
                                                {
                                                    borderColor: theme.colors.border,
                                                    backgroundColor: isSelected(item.value) ? theme.colors.primary : 'transparent'
                                                }
                                            ]}>
                                                {isSelected(item.value) && (
                                                    <Ionicons name="checkmark" size={14} color="#FFF" />
                                                )}
                                            </View>
                                        )}
                                        <Text
                                            style={[
                                                styles.optionText,
                                                {
                                                    color: isSelected(item.value) ? theme.colors.primary : theme.colors.text,
                                                    fontWeight: isSelected(item.value) ? '700' : '400',
                                                    marginLeft: multiple ? 12 : 0
                                                },
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                    </View>
                                    {!multiple && isSelected(item.value) && (
                                        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        {multiple && (
                            <View style={styles.footer}>
                                <TouchableOpacity
                                    style={[styles.confirmButton, { backgroundColor: theme.colors.primary }]}
                                    onPress={closeModal}
                                >
                                    <Text style={styles.confirmButtonText}>Valider</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
    },
    triggerText: {
        fontSize: 16,
    },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    backdropFill: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: height * 0.7,
        paddingTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        padding: 4,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    optionText: {
        fontSize: 16,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#ccc',
    },
    confirmButton: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
