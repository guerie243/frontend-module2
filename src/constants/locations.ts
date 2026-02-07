export const DRC_CITIES = [
    {
        label: 'Kinshasa',
        value: 'Kinshasa',
        communes: [
            { label: 'Bandalungwa', value: 'Bandalungwa' },
            { label: 'Barumbu', value: 'Barumbu' },
            { label: 'Bumbu', value: 'Bumbu' },
            { label: 'Gombe', value: 'Gombe' },
            { label: 'Kalamu', value: 'Kalamu' },
            { label: 'Kasa-Vubu', value: 'Kasa-Vubu' },
            { label: 'Kimbanseke', value: 'Kimbanseke' },
            { label: 'Kinshasa', value: 'Kinshasa' },
            { label: 'Kintambo', value: 'Kintambo' },
            { label: 'Kisenso', value: 'Kisenso' },
            { label: 'Lemba', value: 'Lemba' },
            { label: 'Limete', value: 'Limete' },
            { label: 'Lingwala', value: 'Lingwala' },
            { label: 'Makala', value: 'Makala' },
            { label: 'Maluku', value: 'Maluku' },
            { label: 'Masina', value: 'Masina' },
            { label: 'Matete', value: 'Matete' },
            { label: 'Mont-Ngafula', value: 'Mont-Ngafula' },
            { label: 'Nsele', value: 'Nsele' },
            { label: 'Ndjili', value: 'Ndjili' },
            { label: 'Ngaba', value: 'Ngaba' },
            { label: 'Ngaliema', value: 'Ngaliema' },
            { label: 'Ngiri-Ngiri', value: 'Ngiri-Ngiri' },
            { label: 'Selembao', value: 'Selembao' },
        ]
    },
    {
        label: 'Lubumbashi',
        value: 'Lubumbashi',
        communes: [
            { label: 'Annexe', value: 'Annexe' },
            { label: 'Kamalondo', value: 'Kamalondo' },
            { label: 'Kampemba', value: 'Kampemba' },
            { label: 'Katuba', value: 'Katuba' },
            { label: 'Kenya', value: 'Kenya' },
            { label: 'Lubumbashi', value: 'Lubumbashi' },
            { label: 'Rwashi', value: 'Rwashi' },
        ]
    },
    {
        label: 'Kolwezi',
        value: 'Kolwezi',
        communes: [
            { label: 'Dilala', value: 'Dilala' },
            { label: 'Manika', value: 'Manika' },
        ]
    },
    {
        label: 'Mbuji-Mayi',
        value: 'Mbuji-Mayi',
        communes: [
            { label: 'Bipemba', value: 'Bipemba' },
            { label: 'Dibindi', value: 'Dibindi' },
            { label: 'Kanshi', value: 'Kanshi' },
            { label: 'Muya', value: 'Muya' },
        ]
    },
    {
        label: 'Kisangani',
        value: 'Kisangani',
        communes: [
            { label: 'Makiso', value: 'Makiso' },
            { label: 'Kabondo', value: 'Kabondo' },
            { label: 'Mangobo', value: 'Mangobo' },
            { label: 'Tshopo', value: 'Tshopo' },
            { label: 'Lubunga', value: 'Lubunga' },
            { label: 'Kisangani', value: 'Kisangani' },
        ]
    },
    {
        label: 'Goma',
        value: 'Goma',
        communes: [
            { label: 'Goma', value: 'Goma' },
            { label: 'Karisimbi', value: 'Karisimbi' },
        ]
    },
    {
        label: 'Bukavu',
        value: 'Bukavu',
        communes: [
            { label: 'Ibanda', value: 'Ibanda' },
            { label: 'Kadutu', value: 'Kadutu' },
            { label: 'Bagira', value: 'Bagira' },
        ]
    }
] as const;

export const LOCATION_OPTIONS = DRC_CITIES.map(city => ({
    label: city.label,
    value: city.value
}));

export type CityName = typeof DRC_CITIES[number]['value'];
