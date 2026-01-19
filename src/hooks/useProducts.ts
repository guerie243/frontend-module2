/**
 * Product Hooks
 * 
 * TanStack Query hooks for product data operations
 * Pattern from Module 1 useAnnonces
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { Product } from '../types';

/**
 * Infinite scroll hook for products feed
 */
export const useProducts = (category = '', search = '', enabled = true) => {
    return useInfiniteQuery({
        queryKey: ['products', 'feed', category, search],
        queryFn: ({ pageParam = 1 }) => productService.getAllProducts(pageParam, 20, category, search),
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.data && lastPage.data.length === 20) {
                return allPages.length + 1;
            }
            return undefined;
        },
        enabled,
    });
};

/**
 * Get products by vitrine ID
 */
export const useProductsByVitrine = (vitrineId: string, enabled = true) => {
    return useInfiniteQuery({
        queryKey: ['products', 'vitrine', vitrineId],
        queryFn: ({ pageParam = 1 }) => productService.getProductsByVitrine(vitrineId, pageParam, 20),
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage && lastPage.length === 20) {
                return allPages.length + 1;
            }
            return undefined;
        },
        enabled: enabled && !!vitrineId,
    });
};

/**
 * Get single product by slug
 */
export const useProductDetail = (slug: string, enabled = true) => {
    return useQuery({
        queryKey: ['products', slug],
        queryFn: () => productService.getProductBySlug(slug),
        enabled: enabled && !!slug,
    });
};

/**
 * Create product mutation
 */
export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Product>) => productService.createProduct(data),
        onSuccess: () => {
            console.log('Product created successfully');
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error: any) => {
            console.error('Product creation error:', error.response?.data || error.message);
        },
    });
};

/**
 * Update product mutation
 */
export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
            productService.updateProduct(id, data),
        onSuccess: (updatedProduct) => {
            console.log('Product updated successfully');
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.setQueryData(['products', updatedProduct.slug], updatedProduct);
        },
        onError: (error: any) => {
            console.error('Product update error:', error.response?.data || error.message);
        },
    });
};

/**
 * Delete product mutation
 */
export const useDeleteProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => productService.deleteProduct(id),
        onSuccess: () => {
            console.log('Product deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error: any) => {
            console.error('Product deletion error:', error.response?.data || error.message);
        },
    });
};
