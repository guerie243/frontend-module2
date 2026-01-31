/**
 * Image Carousel Component
 * 
 * Swipeable image carousel for product detail screens
 * Simplified version adapted from Module 1
 */

import React, { useState } from 'react';
import { View, FlatList, Dimensions, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const IMAGE_HEIGHT = screenWidth * 0.75; // 75% of screen width

interface ImageCarouselProps {
    images: string[];
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
    const { theme } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surfaceLight }]}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    Aucune image disponible
                </Text>
            </View>
        );
    }

    const handleScroll = (event: any) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / screenWidth);
        setActiveIndex(index);
    };

    const renderItem = ({ item }: { item: string }) => (
        <View style={styles.imageContainer}>
            <Image
                source={{ uri: item }}
                style={styles.image}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
            />
        </View>
    );

    const renderDots = () => (
        <View style={styles.dotContainer}>
            {images.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        { backgroundColor: theme.colors.border },
                        activeIndex === index && [
                            styles.activeDot,
                            { backgroundColor: theme.colors.primary }
                        ],
                    ]}
                />
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={images}
                renderItem={renderItem}
                keyExtractor={(item, index) => `image-${index}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
            />
            {images.length > 1 && renderDots()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: screenWidth,
        height: IMAGE_HEIGHT,
    },
    imageContainer: {
        width: screenWidth,
        height: IMAGE_HEIGHT,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    emptyContainer: {
        width: screenWidth,
        height: IMAGE_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
    },
    dotContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 16,
        width: '100%',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    activeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});
