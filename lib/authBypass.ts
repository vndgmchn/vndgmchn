import { useSyncExternalStore } from 'react';

let bypassed = false;
const listeners = new Set<() => void>();

export function setAuthBypass(value: boolean) {
    if (!__DEV__) return;
    bypassed = value;
    listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useAuthBypass() {
    return useSyncExternalStore(subscribe, () => __DEV__ && bypassed, () => false);
}
