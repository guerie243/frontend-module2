import React, { useState } from 'react';
import {
    TouchableOpacity,
    View,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    Modal,
    Animated,
    Easing,
    Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { compressImage } from '../utils/imageUploader';
import { useAlertService } from '../utils/alertService';
import { useEffect } from 'react';

import { getSafeUri } from '../utils/imageUtils';

const SCREEN_WIDTH = Dimensions.get("window").width;
const DefaultCover = require('../../assets/images/default_cover.png');

const ImageUploadCover = ({
    initialImage,
    onUploadSuccess,
    onImagePress,
    height = 130
}: {
    initialImage?: string;
    onUploadSuccess?: (uri: string) => void;
    onImagePress?: (url: string) => void;
    height?: number;
}) => {
    const resolvedInitialImage = getSafeUri(initialImage);
    const [imageUri, setImageUri] = useState(resolvedInitialImage);
    const [loading, setLoading] = useState(false);
    const { showError } = useAlertService();

    // Sync state with prop changes - only when loading is finished
    useEffect(() => {
        if (!loading) {
            setImageUri(getSafeUri(initialImage));
        }
    }, [initialImage, loading]);





    // LOGIQUE MODALE
    const [modalVisible, setModalVisible] = useState(false);
    const [scale] = useState(new Animated.Value(0));

    const hasImage = !!imageUri;

    const openModal = () => {
        if (onImagePress && hasImage) {
            onImagePress(imageUri || initialImage || '');
            return;
        }
        if (hasImage) {
            setModalVisible(true);
            scale.setValue(0);
            Animated.timing(scale, {
                toValue: 1,
                duration: 250,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();
        }
    };

    const handleImagePick = async () => {
        console.log('[ImageUploadCover] Starting image pick...');
        let pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
        });

        console.log('[ImageUploadCover] Picker result:', pickerResult.canceled ? 'Canceled' : 'Success');
        if (pickerResult.canceled) return;

        const localImageUri = pickerResult.assets[0].uri;
        console.log('[ImageUploadCover] Local URI:', localImageUri);
        setImageUri(localImageUri);

        try {
            setLoading(true);
            console.log('[ImageUploadCover] Compressing image:', localImageUri);
            const compressedUri = await compressImage(localImageUri);
            console.log('[ImageUploadCover] Compressed URI:', compressedUri);

            if (onUploadSuccess) {
                console.log('[ImageUploadCover] Calling onUploadSuccess with:', compressedUri);
                onUploadSuccess(compressedUri);
            }

        } catch (error) {
            console.error('[ImageUploadCover] Error processing image:', error);
            showError('Impossible de traiter l\'image de couverture.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <View style={[styles.container, { height }]}>
                <Pressable onPress={openModal} style={styles.content}>
                    <Image
                        source={imageUri ? { uri: imageUri } : DefaultCover}
                        style={[styles.coverImage, { height }]}
                        contentFit="cover"
                        transition={300}
                        cachePolicy="memory-disk"
                    />

                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#fff" />
                        </View>
                    )}
                </Pressable>

                <TouchableOpacity
                    onPress={handleImagePick}
                    style={styles.addIconContainer}
                    disabled={loading}
                >
                    <MaterialIcons name="photo-camera" size={18} color="#fff" />
                </TouchableOpacity>
            </View>

            <Modal visible={modalVisible} transparent onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalBackground}>
                    <Pressable style={styles.closeArea} onPress={() => setModalVisible(false)} />
                    <Animated.View
                        style={[
                            {
                                width: SCREEN_WIDTH * 0.9,
                                height: height * 3,
                                transform: [{ scale }],
                            },
                        ]}
                    >
                        <Image
                            source={imageUri ? { uri: imageUri } : DefaultCover}
                            style={styles.fullImage}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                        />

                    </Animated.View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        backgroundColor: "#eee",
        position: "relative",
        overflow: "hidden",
    },
    content: {
        flex: 1,
    },
    coverImage: {
        width: "100%",
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    addIconContainer: {
        position: "absolute",
        right: 20,
        bottom: 20,
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: 10,
        borderRadius: 999,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.8)",
        justifyContent: "center",
        alignItems: "center",
    },
    fullImage: {
        width: "100%",
        height: "100%",
        borderRadius: 8,
    },
    closeArea: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});

export default ImageUploadCover;
