import React, { useState } from 'react';
import {
    View,
    Image,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Text,
    Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StaticMapImageProps {
    latitude: number;
    longitude: number;
    label?: string;
    height?: number;
    zoom?: number;
}

const FALLBACK_MAP_IMAGE = 'https://via.placeholder.com/600x400.png?text=Carte+non+disponible';

export const StaticMapImage: React.FC<StaticMapImageProps> = ({
    latitude,
    longitude,
    label,
    height = 200,
    zoom = 12
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Switch to Yandex Static Maps with labels layer (skl) for better recognition
    // Using a more robust zoom level (12) to ensure map data exists
    const mapUrl = `https://static-maps.yandex.ru/1.x/?l=map,skl&ll=${longitude},${latitude}&z=${zoom}&size=600,450&pt=${longitude},${latitude},pm2rdl`;

    const handleOpenMaps = async () => {
        const url = Platform.select({
            ios: `maps://app?daddr=${latitude},${longitude}&dirflg=d`,
            android: `google.navigation:q=${latitude},${longitude}&mode=d`,
            web: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`
        }) || `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;

        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            // Fallback to browser URL if native app link fails
            const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
            await Linking.openURL(browserUrl);
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenMaps}
            style={[styles.container, { height }]}
        >
            <View style={styles.imageContainer}>
                <Image
                    key={`${latitude}-${longitude}-${zoom}`}
                    source={{ uri: error ? FALLBACK_MAP_IMAGE : mapUrl }}
                    style={styles.image}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    onError={() => {
                        setError(true);
                        setLoading(false);
                    }}
                />

                {loading && (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                )}

                {/* Itinerary Overlay Badge */}
                <View style={styles.badge}>
                    <MaterialCommunityIcons name="directions" size={16} color="white" />
                    <Text style={styles.badgeText}>Itinéraire</Text>
                </View>

                {label && (
                    <View style={styles.labelContainer}>
                        <Text style={styles.labelText} numberOfLines={1}>{label}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
    },
    imageContainer: {
        flex: 1,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(245, 245, 245, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0, 122, 255, 0.9)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    labelContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    labelText: {
        color: 'white',
        fontSize: 11,
        textAlign: 'center',
    }
});

