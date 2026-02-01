/**
 * Vitrine Hooks
 * 
 * TanStack Query hooks for vitrine data operations
 * Communicates with Module 1 backend
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { vitrineService } from '../services/vitrineService';
import { Vitrine } from '../types';

/**
 * Get single vitrine by slug
 */
export const useVitrineDetail = (slug: string, enabled = true) => {
    return useQuery({
        queryKey: ['vitrines', slug],
        queryFn: () => vitrineService.getVitrineBySlug(slug),
        enabled: enabled && !!slug && slug !== 'undefined',
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

export const useUpdateVitrine = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ slug, data }: { slug: string; data: Partial<Vitrine> }) =>
            vitrineService.updateVitrine(slug, data),
        onSuccess: (updatedVitrine, variables) => {
            console.log('Vitrine updated successfully');

            // Invalider TOUTES les queries de vitrines pour forcer le rafraîchissement
            queryClient.invalidateQueries({ queryKey: ['vitrines'] });

            // Mettre à jour le cache avec les nouvelles données pour le slug spécifique
            queryClient.setQueryData(['vitrines', variables.slug], updatedVitrine);

            // Forcer un refetch immédiat
            queryClient.refetchQueries({ queryKey: ['vitrines', 'my'] });
            queryClient.refetchQueries({ queryKey: ['vitrines', variables.slug] });
        },
    });
};
