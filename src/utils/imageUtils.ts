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

    // If it's a relative path starting with /, prepend the base backend URL
    if (uri.startsWith('/')) {
        // Assume relative paths come from Module 1 Backend (where vitrines are stored)
        const baseUrl = ENV.MODULE1_API_URL.replace('/api', '');
        return `${baseUrl}${uri}`;
    }

    return uri;
};
