import React, { useState, useCallback } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { compressImage } from '../utils/imageUploader';
import { useAlertService } from '../utils/alertService';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 60) / 3;

const generateId = () => Math.random().toString(36).substring(2, 9);

interface ImageItem {
    uri: string;
    id: string;
}

const MAX_IMAGES = 5;

export default function ImagePictureUploader({
    images,
    setImages
}: {
    images: ImageItem[];
    setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
}) {
    const [isPickerActive, setIsPickerActive] = useState(false);
    const { showWarning, showInfo } = useAlertService();

    const pickImages = async () => {
        if (isPickerActive) return;

        if (images.length >= MAX_IMAGES) {
            showWarning(`Vous ne pouvez pas ajouter plus de ${MAX_IMAGES} images.`, 'Limite atteinte');
            return;
        }

        setIsPickerActive(true);

        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permission.status !== 'granted') {
                showWarning('L\'accès à votre galerie est requis.', 'Autorisation Nécessaire');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 1,
            });

            if (!result.canceled) {
                const remainingSlots = MAX_IMAGES - images.length;
                let selectedAssets = result.assets;

                if (selectedAssets.length > remainingSlots) {
                    showInfo(`Seules les ${remainingSlots} premières images sélectionnées ont été ajoutées.`, 'Limite dépassée');
                    selectedAssets = selectedAssets.slice(0, remainingSlots);
                }

                const newImages: ImageItem[] = [];
                for (const asset of selectedAssets) {
                    const compressedUri = await compressImage(asset.uri);
                    newImages.push({ uri: compressedUri, id: generateId() });
                }
                setImages((prev) => [...prev, ...newImages]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsPickerActive(false);
        }
    };

    const removeImage = (id: string) => {
        setImages((prev) => prev.filter((img) => img.id !== id));
    };

    const renderItem = useCallback(({ item, drag }: { item: ImageItem; drag: () => void }) => {
        return (
            <TouchableOpacity
                onLongPress={drag}
                style={styles.imageContainer}
            >
                <Image
                    source={item.uri}
                    style={styles.image}
                    contentFit="cover"
                    contentFit="cover"
                />
                <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeImage(item.id)}
                >
                    <MaterialIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }, []);

    return (
        <View style={styles.container}>
            <DraggableFlatList
                data={images}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => setImages(data)}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListFooterComponent={
                    images.length < MAX_IMAGES ? (
                        <TouchableOpacity style={styles.addButton} onPress={pickImages}>
                            <MaterialIcons name="add-a-photo" size={30} color="#666" />
                        </TouchableOpacity>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
    },
    imageContainer: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        marginRight: 10,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#eee',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    addButton: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fafafa',
    },
    removeBtn: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 2,
    },
});
