/**
 * Vitrine Hooks
 * 
 * TanStack Query hooks for vitrine data operations
 * Communicates with Module 1 backend
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { vitrineService } from '../services/vitrineService';

/**
 * Get single vitrine by slug
 */
export const useVitrineDetail = (slug: string, enabled = true) => {
    return useQuery({
        queryKey: ['vitrines', slug],
        queryFn: () => vitrineService.getVitrineBySlug(slug),
        enabled: enabled && !!slug,
    });
};

/**
 * Get all vitrines owned by authenticated user
 */
export const useMyVitrines = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['vitrines', 'my'],
        queryFn: () => vitrineService.getAllOwnerVitrines(),
        enabled: options?.enabled !== false,
    });
};

/**
 * Get all vitrines with filters
 */
export const useAllVitrines = (category = '', search = '', enabled = true) => {
    return useQuery({
        queryKey: ['vitrines', 'all', category, search],
        queryFn: () => vitrineService.getAllVitrines(1, 20, category, search),
        enabled,
    });
};
