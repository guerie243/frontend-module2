/**
 * Product Categories Constants
 * 
 * List of product categories with icons
 */

export const PRODUCT_CATEGORIES = [
    { id: '', label: 'Tous', icon: 'apps-outline' },

    { id: 'electronics', label: 'Téléphones & Électronique', icon: 'phone-portrait-outline' },
    { id: 'fashion', label: 'Vêtements & Chaussures', icon: 'shirt-outline' },
    { id: 'food', label: 'Nourriture', icon: 'restaurant-outline' },
    { id: 'beauty', label: 'Beauté & Soins', icon: 'sparkles-outline' },
    { id: 'home', label: 'Maison', icon: 'home-outline' },

    { id: 'phones', label: 'Téléphones & Accessoires', icon: 'phone-portrait-outline' },
    { id: 'electronics_accessories', label: 'Accessoires électroniques', icon: 'headset-outline' },

    { id: 'sports', label: 'Sports & Loisirs', icon: 'football-outline' },
    { id: 'books', label: 'Livres & Documents', icon: 'book-outline' },
    { id: 'toys', label: 'Jouets', icon: 'game-controller-outline' },

    { id: 'automotive', label: 'Auto & Motos', icon: 'car-outline' },
    { id: 'tools', label: 'Outils & Matériel', icon: 'hammer-outline' },

    { id: 'other', label: 'Autres', icon: 'ellipsis-horizontal-outline' },
] as const;


export type ProductCategoryId = typeof PRODUCT_CATEGORIES[number]['id'];
