import React, { useState } from 'react';
import {
    TouchableOpacity,
    View,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Animated,
    Easing,
    Pressable,
    ViewStyle,
    FlexAlignType,
    Platform
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { compressImage } from '../utils/imageUploader';
import { useAlertService } from '../utils/alertService';
import { useEffect } from 'react';

import { getSafeUri } from '../utils/imageUtils';

// Image par défaut 
const DefaultAvatar = require('../../assets/images/default_avatar.png');

const ImageUploadAvatar = ({
    initialImage,
    onUploadSuccess,
    onImagePress,
    size = 120
}: {
    initialImage?: string;
    onUploadSuccess?: (uri: string) => void;
    onImagePress?: (url: string) => void;
    size?: number;
}) => {
    const resolvedInitialImage = getSafeUri(initialImage);
    const [imageUri, setImageUri] = useState(resolvedInitialImage);
    const [loading, setLoading] = useState(false);
    const { showError } = useAlertService();

    // Modale logic moved here if needed




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
        let pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (pickerResult.canceled) return;

        const localImageUri = pickerResult.assets[0].uri;
        setImageUri(localImageUri);

        try {
            setLoading(true);
            const compressedUri = await compressImage(localImageUri);

            if (onUploadSuccess) {
                onUploadSuccess(compressedUri);
            }

        } catch (error) {
            showError('Impossible de traiter l\'image.');
            setImageUri(initialImage);
        } finally {
            setLoading(false);
        }
    };

    const avatarShape: ViewStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#ddd',
        borderColor: '#eee',
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center' as FlexAlignType,
        overflow: 'hidden',
    };

    const imageStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
    };

    return (
        <>
            <View style={styles.wrapper}>
                <Pressable
                    onPress={openModal}
                    style={avatarShape}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#000" />
                    ) : (
                        <Image
                            source={imageUri || DefaultAvatar}
                            style={imageStyle}
                            contentFit="cover"
                            transition={300}
                        />
                    )}
                </Pressable>

                <TouchableOpacity
                    onPress={handleImagePick}
                    style={[
                        styles.overlayIconContainer,
                        {
                            right: 0,
                            bottom: 0,
                            transform: [{ translateX: 10 }, { translateY: 10 }],
                        }
                    ]}
                    disabled={loading}
                >
                    <MaterialIcons name="add-a-photo" size={size * 0.2} color="#fff" />
                </TouchableOpacity>
            </View>

            <Modal visible={modalVisible} transparent onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalBackground}>
                    <Pressable style={styles.closeArea} onPress={() => setModalVisible(false)} />
                    <Animated.View
                        style={[
                            {
                                width: size * 3,
                                height: size * 3,
                                borderRadius: 10,
                                transform: [{ scale }],
                                overflow: 'hidden'
                            },
                        ]}
                    >
                        <Image
                            source={imageUri ? imageUri : DefaultAvatar}
                            style={styles.fullImage}
                            contentFit="contain"
                        />
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
    },
    overlayIconContainer: {
        position: 'absolute',
        backgroundColor: '#333',
        borderRadius: 999,
        padding: 5,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.8)",
        alignItems: "center",
        justifyContent: "center",
    },
    fullImage: {
        width: "100%",
        height: "100%",
    },
    closeArea: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
});

export default ImageUploadAvatar;
