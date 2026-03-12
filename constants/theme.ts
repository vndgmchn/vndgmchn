/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    mutedText: '#687076',
    background: '#fff',
    surface: '#f9f9f9',
    border: '#ccc',
    primary: '#0a7ea4',
    secondary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    destructive: '#ef4444',
    sealed: '#8b5cf6',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F5F5F5',
    mutedText: '#A3A3A3',
    background: '#121212',
    surface: '#1E1E1E',
    border: '#2E2E2E',
    primary: '#0a7ea4',
    secondary: '#818cf8',
    success: '#34d399',
    warning: '#fbbf24',
    destructive: '#f87171',
    sealed: '#a78bfa',
    tint: tintColorDark,
    icon: '#A3A3A3',
    tabIconDefault: '#A3A3A3',
    tabIconSelected: '#FFFFFF',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
