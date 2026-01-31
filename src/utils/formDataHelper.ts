import { Platform } from 'react-native';

/**
 * Converts a flat object into FormData, handling files (local URIs).
 * Supports arrays of files (e.g., images).
 * ASYNC to support fetching Blobs on Web.
 */
export const toFormData = async (data: Record<string, any>): Promise<FormData> => {
    console.log('[formDataHelper] toFormData: Starting conversion with keys:', Object.keys(data));
    const formData = new FormData();

    for (const key of Object.keys(data)) {
        const value = data[key];

        if (value === undefined || value === null) continue;

        // Case for arrays (often for images, but also for locations, etc.)
        if (Array.isArray(value)) {
            // Check if this is an array of file URIs or an array of simple values
            const hasFileUris = value.some(item => {
                const itemUri = (typeof item === 'string') ? item : (item && typeof item === 'object' ? (item as any).uri : null);
                return itemUri && typeof itemUri === 'string' && (itemUri.startsWith('file://') || itemUri.startsWith('content://') || itemUri.startsWith('blob:') || itemUri.startsWith('data:'));
            });

            if (hasFileUris) {
                // Process as file array
                for (let i = 0; i < value.length; i++) {
                    const item = value[i];
                    const itemUri = (typeof item === 'string') ? item : (item && typeof item === 'object' ? (item as any).uri : null);

                    if (itemUri && typeof itemUri === 'string' && (itemUri.startsWith('file://') || itemUri.startsWith('content://') || itemUri.startsWith('blob:') || itemUri.startsWith('data:'))) {
                        // It's a local file
                        console.log(`[toFormData] Processing file array item ${i}:`, itemUri);
                        if (Platform.OS === 'web') {
                            // On Web, convert URI to Blob
                            try {
                                const response = await fetch(itemUri);
                                const blob = await response.blob();
                                formData.append(key, blob, `image_${Date.now()}_${i}.jpg`);
                                console.log(`[toFormData] Appended blob for item ${i}, size: ${blob.size}`);
                            } catch (e) {
                                console.error("Error converting Web Blob:", e);
                            }
                        } else {
                            // Native
                            console.log(`[toFormData] Appending native file for item ${i}`);
                            formData.append(key, {
                                uri: (Platform.OS === 'ios') ? itemUri.replace('file://', '') : itemUri,
                                type: 'image/jpeg',
                                name: `${key}_${i}.jpg`,
                            } as any);
                        }
                    } else {
                        // Non-file: append directly
                        console.log(`[toFormData] Appending non-file item ${i}:`, item);
                        formData.append(key, item);
                    }
                }
            } else {
                // Array of simple values (e.g., locations: ['Alger', 'Oran'])
                // Stringify the entire array so backend can parse it
                console.log(`[toFormData] Stringifying non-file array for key '${key}':`, value);
                formData.append(key, JSON.stringify(value));
            }
        }
        // Case for single file (uri string or object with uri)
        else if (
            (typeof value === 'string' && (value.startsWith('file://') || value.startsWith('content://') || value.startsWith('blob:') || value.startsWith('data:'))) ||
            (typeof value === 'object' && value !== null && typeof (value as any).uri === 'string' && ((value as any).uri.startsWith('file://') || (value as any).uri.startsWith('content://') || (value as any).uri.startsWith('blob:') || (value as any).uri.startsWith('data:')))
        ) {
            const uri = typeof value === 'string' ? value : (value as any).uri;

            if (Platform.OS === 'web') {
                try {
                    console.log(`[toFormData] Processing single file (Web):`, uri);
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    formData.append(key, blob, `image_${Date.now()}.jpg`);
                    console.log(`[toFormData] Appended blob, size: ${blob.size}`);
                } catch (e) {
                    console.error("Error converting Web Blob (Single):", e);
                }
            } else {
                console.log(`[toFormData] Processing single file (Native):`, uri);
                formData.append(key, {
                    uri: (Platform.OS === 'ios') ? uri.replace('file://', '') : uri,
                    type: 'image/jpeg',
                    name: `${key}.jpg`,
                } as any);
            }
        }
        // Case for objects (not a file)
        else if (typeof value === 'object' && value !== null) {
            formData.append(key, JSON.stringify(value));
        }
        // Simple value
        else {
            formData.append(key, value);
        }
    }

    console.log('[formDataHelper] toFormData: Conversion complete');
    return formData;
};

/**
 * Check if data contains files that require FormData
 */
export const hasFiles = (data: any): boolean => {
    return Object.values(data).some(value => {
        // String URI
        if (typeof value === 'string' && (value.startsWith('file://') || value.startsWith('content://') || value.startsWith('blob:') || value.startsWith('data:'))) {
            return true;
        }
        // Object with uri property
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const v = value as any;
            if (typeof v.uri === 'string' && (v.uri.startsWith('file://') || v.uri.startsWith('content://') || v.uri.startsWith('blob:') || v.uri.startsWith('data:'))) {
                return true;
            }
        }
        // Array containing URIs
        if (Array.isArray(value)) {
            return value.some(v => {
                const uri = (typeof v === 'string') ? v : (v && typeof v === 'object' ? (v as any).uri : null);
                return typeof uri === 'string' && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('blob:') || uri.startsWith('data:'));
            });
        }
        return false;
    });
};
