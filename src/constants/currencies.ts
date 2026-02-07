export const CURRENCY_OPTIONS = [
    { label: 'USD ($) – Dollar américain', value: 'USD' },
    { label: 'CDF (FC) – Franc congolais', value: 'CDF' },
] as const;

export type CurrencyCode = typeof CURRENCY_OPTIONS[number]['value'];

