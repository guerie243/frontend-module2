/**
 * Product Categories Constants
 * 
 * List of product categories with icons
 */

export const PRODUCT_CATEGORIES = [
    { id: '', label: 'Tous', icon: 'apps-outline' },
    { id: 'electronics', label: 'Électronique', icon: 'laptop-outline' },
    { id: 'fashion', label: 'Mode', icon: 'shirt-outline' },
    { id: 'food', label: 'Alimentation', icon: 'restaurant-outline' },
    { id: 'beauty', label: 'Beauté', icon: 'sparkles-outline' },
    { id: 'home', label: 'Maison', icon: 'home-outline' },
    { id: 'sports', label: 'Sports', icon: 'football-outline' },
    { id: 'books', label: 'Livres', icon: 'book-outline' },
    { id: 'toys', label: 'Jouets', icon: 'game-controller-outline' },
    { id: 'automotive', label: 'Auto', icon: 'car-outline' },
    { id: 'other', label: 'Autres', icon: 'ellipsis-horizontal-outline' },
] as const;

export type ProductCategoryId = typeof PRODUCT_CATEGORIES[number]['id'];
