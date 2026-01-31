/**
 * MapWebView Component
 * 
 * Displays an interactive Google Maps view with a pin at specified coordinates
 * Uses react-native-webview for cross-platform compatibility
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';

interface MapWebViewProps {
    lat: number;
    lon: number;
    zoom?: number;
    height?: number;
    label?: string;
}

export const MapWebView: React.FC<MapWebViewProps> = ({
    lat,
    lon,
    zoom = 15,
    height = 300,
    label = ''
}) => {
    const { theme } = useTheme();

    // Google Maps embed URL with marker
    const mapUrl = `https://maps.google.com/maps?q=${lat},${lon}&z=${zoom}&output=embed`;

    // HTML wrapper to satisfy "must be used in an iframe" requirement
    const htmlSource = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
                    iframe { width: 100%; height: 100%; border: 0; }
                </style>
            </head>
            <body>
                <iframe 
                    src="${mapUrl}"
                    allowfullscreen=""
                    loading="lazy">
                </iframe>
            </body>
        </html>
    `;

    return (
        <View style={[styles.container, { height }]}>
            <WebView
                source={{ html: htmlSource }}
                style={styles.webview}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.surface }]}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                )}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        overflow: 'hidden',
        borderRadius: 12,
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MapWebView;
