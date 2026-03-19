export type StorefrontTheme = {
    id: string;
    name: string;
    cardBackground: string | null;
    textPrimary: string | null;
    textSecondary: string | null;
    buttonSurface: string | null;
    buttonText: string | null;
};

export const STOREFRONT_THEMES: StorefrontTheme[] = [
    {
        id: 'default',
        name: 'Default',
        cardBackground: null,
        textPrimary: null,
        textSecondary: null,
        buttonSurface: null,
        buttonText: null
    },
    {
        id: 'lavender',
        name: 'Lavender',
        cardBackground: '#EDE9FE',
        textPrimary: '#5B21B6',
        textSecondary: 'rgba(91, 33, 182, 0.6)',
        buttonSurface: '#5B21B6',
        buttonText: '#FFFFFF'
    },
    {
        id: 'mint',
        name: 'Mint',
        cardBackground: '#DCFCE7',
        textPrimary: '#166534',
        textSecondary: 'rgba(22, 101, 52, 0.6)',
        buttonSurface: '#166534',
        buttonText: '#FFFFFF'
    },
    {
        id: 'sky',
        name: 'Sky',
        cardBackground: '#E0F2FE',
        textPrimary: '#075985',
        textSecondary: 'rgba(7, 89, 133, 0.6)',
        buttonSurface: '#075985',
        buttonText: '#FFFFFF'
    },
    {
        id: 'peach',
        name: 'Peach',
        cardBackground: '#FFEDD5',
        textPrimary: '#9A3412',
        textSecondary: 'rgba(154, 52, 18, 0.6)',
        buttonSurface: '#9A3412',
        buttonText: '#FFFFFF'
    },
    {
        id: 'rose',
        name: 'Rose',
        cardBackground: '#FFE4E6',
        textPrimary: '#9F1239',
        textSecondary: 'rgba(159, 18, 57, 0.6)',
        buttonSurface: '#9F1239',
        buttonText: '#FFFFFF'
    },
    {
        id: 'sand',
        name: 'Sand',
        cardBackground: '#FEF9C3',
        textPrimary: '#854D0E',
        textSecondary: 'rgba(133, 77, 14, 0.6)',
        buttonSurface: '#854D0E',
        buttonText: '#FFFFFF'
    },
];

export const getThemePreset = (presetId: string | null | undefined) => {
    return STOREFRONT_THEMES.find(t => t.id === presetId) || STOREFRONT_THEMES[0];
};
