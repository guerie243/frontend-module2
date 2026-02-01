import { ENV } from '../config/config';

/**
 * Resolves an image source into a safe URI.
 * Handles relative paths from the backend and absolute URLs.
 * 
 * @param source - The image source (string, object with uri, or array)
 * @returns A safe URI string or undefined
 */
export const getSafeUri = (source: any): string | undefined => {
    if (!source) return undefined;

    let uri: string | undefined;

    if (typeof source === 'string') {
        uri = source;
    } else if (source && typeof source === 'object') {
        uri = source.uri || source.url || source.logo || source.coverImage || source.banner || source.avatar;
    }

    if (!uri && Array.isArray(source) && source.length > 0) {
        return getSafeUri(source[0]);
    }

    if (!uri || typeof uri !== 'string') return undefined;

    // Radical fix for local IPs in database records when on production
    if (uri.includes('192.168.')) {
        // Try to extract the path after the port (usually :3000 or :5000)
        const parts = uri.split(/(?::\d+)/);
        if (parts.length > 1) {
            const path = parts[1];
            const baseUrl = ENV.MODULE1_API_URL.replace('/api', '');
            const resolved = `${baseUrl}${path}`;
            console.log(`[ImageUtils] Radical Swap: ${uri} -> ${resolved}`);
            return resolved;
        }
    }

    // Resolve relative paths
    if (uri.startsWith('/')) {
        const baseUrl = ENV.MODULE1_API_URL.replace('/api', '');
        return `${baseUrl}${uri}`;
    }

    return uri;
};

