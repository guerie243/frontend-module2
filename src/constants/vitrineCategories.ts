/**
 * Vitrine Categories Constants
 * 
 * List of categories specifically for Vitrines (Showcases)
 */

export const VITRINE_CATEGORIES = [
    { label: 'Tout', value: 'all' },
    { label: 'Boutique', value: 'Boutique' },
    { label: 'Magasin', value: 'Magasin' },
    { label: 'Restaurant', value: 'Restaurant' },
    { label: 'Hôtel', value: 'Hôtel' },
    { label: 'Services', value: 'Services' },
    { label: 'Digital', value: 'Digital' },
    { label: 'Mode', value: 'Mode' },
] as const;

export type VitrineCategoryId = typeof VITRINE_CATEGORIES[number]['value'];
