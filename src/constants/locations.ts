export const ALGERIA_CITIES = [
    {
        label: 'Alger',
        value: 'Alger',
        communes: [
            { label: 'Alger Centre', value: 'Alger Centre' },
            { label: 'Sidi M\'Hamed', value: 'Sidi M\'Hamed' },
            { label: 'El Biar', value: 'El Biar' },
            { label: 'Bouzareah', value: 'Bouzareah' },
            { label: ' Hydra', value: 'Hydra' },
            { label: 'Bir Mourad Raïs', value: 'Bir Mourad Raïs' },
            { label: 'Dely Ibrahim', value: 'Dely Ibrahim' },
            { label: 'Cheraga', value: 'Cheraga' },
            { label: 'Bab El Oued', value: 'Bab El Oued' },
            { label: 'Kouba', value: 'Kouba' },
        ]
    },
    {
        label: 'Oran',
        value: 'Oran',
        communes: [
            { label: 'Oran Centre', value: 'Oran Centre' },
            { label: 'Bir El Djir', value: 'Bir El Djir' },
            { label: 'Es Senia', value: 'Es Senia' },
            { label: 'Arzew', value: 'Arzew' },
            { label: 'Sidi Chami', value: 'Sidi Chami' },
        ]
    },
    {
        label: 'Constantine',
        value: 'Constantine',
        communes: [
            { label: 'Constantine Centre', value: 'Constantine Centre' },
            { label: 'El Khroub', value: 'El Khroub' },
            { label: 'Hamma Bouziane', value: 'Hamma Bouziane' },
            { label: 'Didouche Mourad', value: 'Didouche Mourad' },
        ]
    },
    {
        label: 'Sétif',
        value: 'Sétif',
        communes: [
            { label: 'Sétif Centre', value: 'Sétif Centre' },
            { label: 'El Eulma', value: 'El Eulma' },
            { label: 'Ain Arnat', value: 'Ain Arnat' },
        ]
    }
] as const;

export const LOCATION_OPTIONS = ALGERIA_CITIES.map(city => ({
    label: city.label,
    value: city.value
}));

export type CityName = typeof ALGERIA_CITIES[number]['value'];
