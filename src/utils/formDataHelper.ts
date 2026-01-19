/**
 * FormData Helper Utility
 * 
 * Converts objects to FormData for multipart/form-data uploads
 * Pattern from Module 1
 */

/**
 * Convert an object to FormData for file uploads
 * Handles images, arrays, and nested objects
 */
export const toFormData = async (data: any): Promise<FormData> => {
    const formData = new FormData();

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const value = data[key];

            // Skip undefined or null values
            if (value === undefined || value === null) {
                continue;
            }

            // Handle arrays (e.g., images)
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (typeof item === 'string' && (item.startsWith('file://') || item.startsWith('content://') || item.startsWith('blob:'))) {
                        // File URI
                        const filename = item.split('/').pop() || `file_${index}`;
                        formData.append(key, {
                            uri: item,
                            type: 'image/jpeg', // Default type
                            name: filename,
                        } as any);
                    } else if (item && typeof item === 'object' && item.uri) {
                        // File object with uri
                        const filename = item.name || item.uri.split('/').pop() || `file_${index}`;
                        formData.append(key, {
                            uri: item.uri,
                            type: item.type || 'image/jpeg',
                            name: filename,
                        } as any);
                    } else {
                        // Regular array item
                        formData.append(key, JSON.stringify(item));
                    }
                });
            }
            // Handle single file
            else if (typeof value === 'string' && (value.startsWith('file://') || value.startsWith('content://') || value.startsWith('blob:'))) {
                const filename = value.split('/').pop() || 'file';
                formData.append(key, {
                    uri: value,
                    type: 'image/jpeg',
                    name: filename,
                } as any);
            }
            // Handle file object
            else if (value && typeof value === 'object' && value.uri) {
                const filename = value.name || value.uri.split('/').pop() || 'file';
                formData.append(key, {
                    uri: value.uri,
                    type: value.type || 'image/jpeg',
                    name: filename,
                } as any);
            }
            // Handle objects
            else if (typeof value === 'object' && !Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            }
            // Handle primitives
            else {
                formData.append(key, String(value));
            }
        }
    }

    return formData;
};

/**
 * Check if data contains files that require FormData
 */
export const hasFiles = (data: any): boolean => {
    return Object.values(data).some(value => {
        // String URI
        if (typeof value === 'string' && (value.startsWith('file://') || value.startsWith('content://') || value.startsWith('blob:'))) {
            return true;
        }
        // Object with uri property
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const v = value as any;
            if (typeof v.uri === 'string' && (v.uri.startsWith('file://') || v.uri.startsWith('content://') || v.uri.startsWith('blob:'))) {
                return true;
            }
        }
        // Array containing URIs
        if (Array.isArray(value)) {
            return value.some(v => {
                const uri = (typeof v === 'string') ? v : (v && typeof v === 'object' ? v.uri : null);
                return typeof uri === 'string' && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('blob:'));
            });
        }
        return false;
    });
};
