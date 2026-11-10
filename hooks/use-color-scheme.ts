import { Appearance } from 'react-native';

export { useColorScheme } from 'react-native';

export function setColorScheme(scheme: 'light' | 'dark') {
    Appearance.setColorScheme(scheme);
}
