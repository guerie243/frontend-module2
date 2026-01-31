import React from 'react';
import {
    Modal,
    View,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ImagePreviewModalProps {
    visible: boolean;
    imageUrl: string | undefined;
    onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
    visible,
    imageUrl,
    onClose
}) => {
    const { theme } = useTheme();

    if (!imageUrl) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />

                {/* Close Button */}
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                >
                    <Ionicons name="close" size={30} color="#FFF" />
                </TouchableOpacity>

                {/* Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        right: 20,
        zIndex: 10,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 25,
    },
    imageContainer: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: height * 0.8,
    },
});
