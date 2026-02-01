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
        uri = source.uri || source.url;
    }

    if (!uri && Array.isArray(source) && source.length > 0) {
        return getSafeUri(source[0]);
    }

    if (!uri) return undefined;

    // Handle relative paths
    if (uri.startsWith('/') || (!uri.startsWith('http') && !uri.startsWith('file') && !uri.startsWith('data'))) {
        const cleanUri = uri.startsWith('/') ? uri : `/${uri}`;
        const baseUrl = ENV.MODULE1_API_URL.replace('/api', '');
        const resolved = `${baseUrl}${cleanUri}`;
        console.log(`[ImageUtils] Resolved relative path: ${uri} -> ${resolved}`);
        return resolved;
    }

    return uri;
};

