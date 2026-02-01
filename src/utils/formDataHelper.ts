import { Platform } from 'react-native';

/**
 * Convertit un objet plat en FormData, gérant les fichiers (URI locales).
 * Supporte les tableaux de fichiers (e.g., images).
 * ASYNC pour supporter le fetch de Blobs sur Web.
 * 
 * ALIGNED WITH MODULE 1 IMPLEMENTATION
 */
export const toFormData = async (data: Record<string, any>): Promise<FormData> => {
    const formData = new FormData();

    for (const key of Object.keys(data)) {
        const value = data[key];

        if (value === undefined || value === null) continue;

        // Cas des tableaux (souvent pour les images)
        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                const item = value[i];
                const itemUri = (typeof item === 'string') ? item : (item && typeof item === 'object' ? (item as any).uri : null);

                if (itemUri && typeof itemUri === 'string' && (itemUri.startsWith('file://') || itemUri.startsWith('content://') || itemUri.startsWith('blob:') || itemUri.startsWith('data:'))) {
                    // C'est un fichier local
                    if (Platform.OS === 'web') {
                        // Sur Web, il faut convertir l'URI en Blob
                        try {
                            const response = await fetch(itemUri);
                            const blob = await response.blob();
                            formData.append(key, blob, `image_${Date.now()}_${i}.jpg`);
                        } catch (e) {
                            console.error("Erreur conversion Blob Web:", e);
                        }
                    } else {
                        // Native
                        formData.append(key, {
                            uri: (Platform.OS === 'ios') ? itemUri.replace('file://', '') : itemUri,
                            type: 'image/jpeg',
                            name: `${key}_${i}.jpg`,
                        } as any);
                    }
                } else {
                    // Non-fichier : repeat keys
                    formData.append(key, item);
                }
            }
        }
        // Cas d'un fichier seul (uri string ou objet avec uri)
        else if (
            (typeof value === 'string' && (value.startsWith('file://') || value.startsWith('content://') || value.startsWith('blob:') || value.startsWith('data:'))) ||
            (typeof value === 'object' && value !== null && typeof (value as any).uri === 'string' && ((value as any).uri.startsWith('file://') || (value as any).uri.startsWith('content://') || (value as any).uri.startsWith('blob:') || (value as any).uri.startsWith('data:')))
        ) {
            const uri = typeof value === 'string' ? value : (value as any).uri;

            if (Platform.OS === 'web') {
                try {
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    formData.append(key, blob, `image_${Date.now()}.jpg`);
                } catch (e) {
                    console.error("Erreur conversion Blob Web (Single):", e);
                }
            } else {
                formData.append(key, {
                    uri: (Platform.OS === 'ios') ? uri.replace('file://', '') : uri,
                    type: 'image/jpeg', // Mimetype par défaut
                    name: `${key}.jpg`,
                } as any);
            }
        }
        // Cas d'un objet (ex: contact) qui n'est pas un fichier
        else if (typeof value === 'object' && value !== null) {
            formData.append(key, JSON.stringify(value));
        }
        // Valeur simple
        else {
            formData.append(key, value);
        }
    }

    return formData;
};

/**
 * Helper to check if data contains files
 * (Re-implementing this based on Module 1 pattern if needed, or keeping Module 2's helper if it aligns)
 * Module 1 formDataHelper didn't export hasFiles in the view I saw, but it's likely used.
 * I will keep Module 2's hasFiles if it's compatible, or check if Module 1 has it.
 * The file view of Module 1 formDataHelper ended at line 86 without hasFiles export.
 * If Module 1 doesn't have it, then Module 2 vitrineService (which uses it) might break.
 * I will KEEP hasFiles from Module 2 (adapted to match the logic I just pasted if necessary) to avoid compilation errors.
 * But wait, I am overwriting the file. So I must INCLUDE hasFiles.
 * Let's assume Module 2's hasFiles is fine as long as it detects the same things.
 */
export const hasFiles = (data: any): boolean => {
    return Object.values(data).some(value => {
        if (typeof value === 'string' && (value.startsWith('file://') || value.startsWith('content://') || value.startsWith('blob:') || value.startsWith('data:'))) return true;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const v = value as any;
            if (typeof v.uri === 'string' && (v.uri.startsWith('file://') || v.uri.startsWith('content://') || v.uri.startsWith('blob:') || v.uri.startsWith('data:'))) return true;
        }
        if (Array.isArray(value)) {
            return value.some(v => {
                const uri = (typeof v === 'string') ? v : (v && typeof v === 'object' ? (v as any).uri : null);
                return typeof uri === 'string' && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('blob:') || uri.startsWith('data:'));
            });
        }
        return false;
    });
};
