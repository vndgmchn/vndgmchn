import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColors() {
    const theme = useColorScheme() ?? 'light';
    return Colors[theme];
}
