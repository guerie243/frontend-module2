/**
 * Rejection Reasons for Orders
 * 
 * Common reasons why a seller might reject an order
 */

export const REJECTION_REASONS = [
    { id: 'closed', label: 'Nous sommes fermés' },
    { id: 'out_of_stock', label: 'Produit non disponible' },
    { id: 'not_in_zone', label: 'Nous ne livrons pas dans votre zone' },
    { id: 'too_small', label: 'Commande trop petite' },
    { id: 'other', label: 'Autre' },
] as const;

export type RejectionReasonId = typeof REJECTION_REASONS[number]['id'];
