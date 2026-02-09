import { Platform, Linking } from 'react-native';

/**
 * Opens the native map application with directions to the specified coordinates.
 * Defaults to driving mode.
 * 
 * @param latitude Destination latitude
 * @param longitude Destination longitude
 * @param label Optional label for the destination (iOS only)
 */
export const openGpsItinerary = (latitude: number, longitude: number, label?: string) => {
    const lat = latitude;
    const lng = longitude;
    const labelEncoded = label ? encodeURIComponent(label) : '';

    const url = Platform.select({
        ios: `maps://?daddr=${lat},${lng}&dirflg=d${label ? `&q=${labelEncoded}` : ''}`,
        android: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
        web: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
    }) || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

    Linking.openURL(url).catch(err => console.error('An error occurred', err));
};
