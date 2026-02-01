import { ENV } from '../config/config';

/**
 * Resolves an image source into a safe URI string.
 * Handles:
 * - Direct strings (URLs or local paths)
 * - Objects with .uri or .url
 * - Arrays of sources
 * - Relative paths (prepends backend base URL)
 * 
 * @param source The image source to resolve
 * @returns A string URI or undefined
 */
export const getSafeUri = (source: any): string | undefined => {
    if (!source) return undefined;
    let uri: string | undefined;

    if (typeof source === 'string') uri = source;
    else if (source.uri) uri = source.uri;
    else if (source.url) uri = source.url;
    else if (Array.isArray(source) && source.length > 0) return getSafeUri(source[0]);

    if (uri && (uri.startsWith('/') && !uri.startsWith('//'))) {
        // Assume relative paths come from Module 1 backend
        const baseUrl = ENV.MODULE1_API_URL.replace('/api', '');
        return `${baseUrl}${uri}`;
    }

    return uri;
};
