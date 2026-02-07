import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getSafeUri } from '../utils/imageUtils';

interface ProductOrderItemProps {
    name: string;
    image?: string;
    quantity: number;
    price: number;
    currency?: string;
    slug?: string;
    productId?: string;
    deliveryFee?: number;
}

export const ProductOrderItem: React.FC<ProductOrderItemProps> = ({
    name,
    image,
    quantity,
    price,
    currency = 'USD',
    slug,
    productId,
    deliveryFee,
}) => {
    const { theme } = useTheme();
    const navigation = useNavigation<any>();
    const handlePress = () => {
        // Prefer productId as it is immutable and unique
        // The backend handles productId passed in the slug parameter
        const identifier = productId || slug;
        if (identifier) {
            navigation.navigate('ProductDetail', { slug: identifier });
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <Image
                source={getSafeUri(image)}
                style={[styles.image, { backgroundColor: theme.colors.background }]}
                contentFit="cover"
                transition={200}
            />
            <View style={styles.info}>
                <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={2}>
                    {name}
                </Text>
                <Text style={[styles.details, { color: theme.colors.textSecondary }]}>
                    {quantity} x {price.toFixed(2)} {currency}
                </Text>
                {deliveryFee !== undefined && (
                    <Text style={[styles.deliveryFee, { color: deliveryFee > 0 ? theme.colors.textSecondary : '#34C759' }]}>
                        {deliveryFee > 0 ? `+ Livraison: ${deliveryFee.toFixed(2)} ${currency}` : 'Livraison gratuite'}
                    </Text>
                )}
            </View>
            <Text style={[styles.total, { color: theme.colors.text }]}>
                {(quantity * price).toFixed(2)} {currency}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    details: {
        fontSize: 12,
    },
    total: {
        fontSize: 14,
        fontWeight: '600',
    },
    deliveryFee: {
        fontSize: 11,
        marginTop: 2,
    },
});
