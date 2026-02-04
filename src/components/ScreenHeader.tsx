import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
    title: string;
    onShare?: () => void;
    showBack?: boolean;
    transparent?: boolean;
    rightElement?: React.ReactNode;
    vitrineLogo?: string;
    vitrineName?: string;
    onVitrinePress?: () => void;
    onBackPress?: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    onShare,
    showBack = true,
    transparent = false,
    rightElement,
    vitrineLogo,
    vitrineName,
    onVitrinePress,
    onBackPress,
}) => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[
            styles.container,
            {
                paddingTop: Platform.OS === 'ios' ? insets.top : 10,
                backgroundColor: transparent ? 'transparent' : theme.colors.surface,
                borderBottomWidth: 0,
            }
        ]}>
            <View style={styles.content}>
                <View style={styles.left}>
                    {showBack && (
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onBackPress || (() => navigation.goBack())}
                        >
                            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    )}
                </View>

                {vitrineName ? (
                    <TouchableOpacity
                        style={styles.vitrineContainer}
                        onPress={onVitrinePress}
                        activeOpacity={0.7}
                    >
                        {vitrineLogo && (
                            <Image
                                source={{ uri: vitrineLogo }}
                                style={styles.vitrineLogo}
                                contentFit="cover"
                            />
                        )}
                        <Text
                            style={[styles.vitrineName, { color: theme.colors.text }]}
                            numberOfLines={1}
                        >
                            {vitrineName}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                ) : (
                    <Text
                        style={[styles.title, { color: theme.colors.text }]}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                )}

                <View style={styles.right}>
                    {/* Bouton Global Commandes */}
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.navigate('OrdersTab')}
                    >
                        <Ionicons name="receipt-outline" size={22} color={theme.colors.text} />
                    </TouchableOpacity>

                    {onShare && (
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onShare}
                        >
                            <Ionicons name="share-social-outline" size={22} color={theme.colors.primary} />
                        </TouchableOpacity>
                    )}
                    {rightElement}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        zIndex: 100,
    },
    content: {
        height: 40, // Reduced from 48
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    left: {
        width: 44,
        alignItems: 'flex-start',
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
    },
    vitrineContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    vitrineName: {
        fontSize: 18,
        fontWeight: '700',
        marginRight: 4,
    },
    vitrineLogo: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        backgroundColor: '#f0f0f0',
    },
});
