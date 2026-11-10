import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// react-native-web's Appearance has no setColorScheme, so the app-level override lives here.
let override: 'light' | 'dark' | null = null;
const listeners = new Set<() => void>();

export function setColorScheme(scheme: 'light' | 'dark') {
  override = scheme;
  listeners.forEach((l) => l());
}

const noopSubscribe = () => () => {};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  // false during static render and hydration, true on the client afterwards.
  const hasHydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const colorScheme = useRNColorScheme();
  const appScheme = useSyncExternalStore(subscribe, () => override, () => null);

  if (hasHydrated) {
    return appScheme ?? colorScheme;
  }

  return 'light';
}
