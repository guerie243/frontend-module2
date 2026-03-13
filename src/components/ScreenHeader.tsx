import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    StatusBar,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePendingSellerOrdersCount, usePendingBuyerOrdersCount } from '../hooks/useCommandes';

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
    hideGlobalButtons?: boolean;
}

import { useCart } from '../context/CartContext';

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
    hideGlobalButtons = false,
}) => {
    const { theme } = useTheme();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { itemCount, totalPrice, cart } = useCart();

    // Pulsing animation for cart pill
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        if (itemCount > 0) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [itemCount]);

    const sellerPending = usePendingSellerOrdersCount();
    const buyerPending = usePendingBuyerOrdersCount();
    const totalPending = buyerPending;

    const hasCartItems = itemCount > 0;

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

                {hasCartItems ? (
                    <View style={styles.cartHeaderContainer}>
                        <Text style={[styles.orderText, { color: theme.colors.text }]}>
                            Commander
                        </Text>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity
                                style={styles.cartPillContainerSmall}
                                onPress={() => navigation.navigate('Cart')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.cartPricePill, { backgroundColor: theme.colors.primary }]}>
                                    <Ionicons name="cart" size={18} color="#FFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.cartPriceTextSmall}>
                                        {totalPrice.toFixed(2)} {cart[0]?.product?.currency || 'USD'}
                                    </Text>
                                    <View style={styles.cartBadgeHeaderSmall}>
                                        <Text style={styles.cartBadgeTextSmall}>{itemCount}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                ) : (
                    vitrineName ? (
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
                    )
                )}

                <View style={[styles.right, hideGlobalButtons && { minWidth: 44 }]}>
                    {!hasCartItems && !hideGlobalButtons && (
                        <>
                            {/* Bouton Global Commandes */}
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => {
                                    console.log('[ScreenHeader] Navigating to MyPurchases');
                                    navigation.navigate('MyPurchases');
                                }}
                            >
                                <Ionicons name="receipt-outline" size={22} color={theme.colors.text} />
                                {totalPending > 0 && (
                                    <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
                                        <Text style={styles.badgeText}>{totalPending > 9 ? '9+' : totalPending}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {onShare && (
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={onShare}
                                >
                                    <Ionicons name="share-social-outline" size={22} color={theme.colors.primary} />
                                </TouchableOpacity>
                            )}
                        </>
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
        height: 48,
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
    cartHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        gap: 12,
    },
    orderText: {
        fontSize: 18,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    cartPillContainerSmall: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartPricePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    cartPriceTextSmall: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '800',
        marginRight: 8,
    },
    cartBadgeHeaderSmall: {
        backgroundColor: '#FFF',
        borderRadius: 11,
        minWidth: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    cartBadgeTextSmall: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
