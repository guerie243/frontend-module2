import React, { useRef, useMemo, useState } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Text
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Définition des dimensions pour l'effet de décalage
const ITEM_WIDTH = Math.round(SCREEN_WIDTH * 0.85); // Item occupe 85% de la largeur
const SPACING = (SCREEN_WIDTH - ITEM_WIDTH) / 2; // Marge/Espacement nécessaire pour le centrage

interface ProductCarouselProps {
    height: Animated.AnimatedInterpolation<number> | Animated.Value | number;
    images: any[];
    onImagePress?: (uri: string) => void;
}

// Fonction utilitaire de normalisation
const normalizeAndFlattenImages = (data: any[]): { uri: string }[] => {
    let sources: { uri: string }[] = [];
    const extract = (item: any) => {
        if (Array.isArray(item)) {
            item.forEach(extract);
        } else if (typeof item === 'object' && item !== null) {
            const uri = item.uri || item.url;
            if (typeof uri === 'string' && uri) {
                sources.push({ uri });
            } else {
                Object.values(item).forEach(extract);
            }
        } else if (typeof item === 'string' && item) {
            sources.push({ uri: item });
        }
    };
    extract(data);
    return sources;
};

export const ProductCarousel: React.FC<ProductCarouselProps> = ({ height, images = [], onImagePress }) => {
    const { theme } = useTheme();
    const scrollX = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    // État pour suivre les images que l'on a autorisé à charger. 
    const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set([0, 1]));

    const normalizedImages = useMemo(() => normalizeAndFlattenImages(images), [images]);
    const imageCount = normalizedImages.length;

    const snapToOffsets = useMemo(() => {
        return normalizedImages.map((_, index) => {
            return index * (ITEM_WIDTH + SPACING);
        });
    }, [normalizedImages.length]);

    // Gestion du Scroll en temps réel
    const handleScroll = (event: any) => {
        const scrollOffset = event.nativeEvent.contentOffset.x;

        // Calcul de l'index arrondi
        const index = Math.round(scrollOffset / (ITEM_WIDTH + SPACING));

        // Si on change d'index (ou si on est au tout début), on met à jour
        if (index !== currentIndex && index >= 0 && index < imageCount) {
            setCurrentIndex(index);

            // Lazy Loading amélioré
            setLoadedIndices(prev => {
                if (prev.has(index) && (index === imageCount - 1 || prev.has(index + 1))) {
                    return prev;
                }
                const next = new Set(prev);
                next.add(index);
                if (index < imageCount - 1) next.add(index + 1);
                return next;
            });
        }

        // Animation standard
        Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
        )(event);
    };

    if (imageCount === 0) {
        return (
            <Animated.View style={{ height, backgroundColor: theme.colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }}>
                {/* Placeholder ou icône par défaut */}
                <Text style={{ color: theme.colors.textTertiary }}>Pas d'image</Text>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={{ height }}>
            <Animated.ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToOffsets={snapToOffsets}
                contentContainerStyle={{ paddingHorizontal: SPACING }}
                scrollEventThrottle={16}
                onScroll={handleScroll}
            >
                {normalizedImages.map((image, index) => {
                    const imageUri = image.uri;
                    const shouldLoad = loadedIndices.has(index);
                    const isError = imageErrors.has(index);

                    return (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={onImagePress ? 0.9 : 1}
                            onPress={() => onImagePress?.(imageUri)}
                            style={[
                                styles.slide,
                                {
                                    width: ITEM_WIDTH,
                                    marginRight: index < imageCount - 1 ? SPACING : 0
                                }
                            ]}
                        >
                            {shouldLoad && !isError ? (
                                <Image
                                    source={{ uri: imageUri }}
                                    style={styles.image}
                                    contentFit="cover" // Changé en cover pour ProductDetail
                                    transition={200}
                                    cachePolicy="memory-disk"
                                    onError={() => {
                                        setImageErrors(prev => new Set(prev).add(index));
                                    }}
                                />
                            ) : (
                                <View style={[styles.image, { backgroundColor: theme.colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{ color: theme.colors.textTertiary }}>Image non dispo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </Animated.ScrollView>

            {/* Indicateur de compteur */}
            {imageCount > 1 && (
                <View style={styles.counterContainer}>
                    <Text style={styles.counterText}>
                        {currentIndex + 1}/{imageCount}
                    </Text>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    slide: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderRadius: 16, // Ajouté pour matcher le style ProductDetail
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    counterContainer: {
        position: 'absolute',
        top: 20, // Ajusté
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    counterText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
