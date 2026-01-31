export const CURRENCY_OPTIONS = [
    { label: 'DZD (DA)', value: 'DZD' },
    { label: 'USD ($)', value: 'USD' },
    { label: 'EUR (€)', value: 'EUR' },
    { label: 'FCFA (CFA)', value: 'FCFA' },
] as const;

export type CurrencyCode = typeof CURRENCY_OPTIONS[number]['value'];
