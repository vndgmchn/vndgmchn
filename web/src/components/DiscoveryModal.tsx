"use client";

import { X } from 'lucide-react';
import { StorefrontTheme } from '@/constants/storefrontThemes';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    theme?: StorefrontTheme;
};

export default function DiscoveryModal({ isOpen, onClose, theme }: Props) {
    if (!isOpen) return null;

    const isDefault = !theme || theme.id === 'default';
    const accentColor = isDefault ? '#2563eb' : theme.buttonSurface;
    const textColor = isDefault ? '#111827' : theme.textPrimary;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="p-8 text-center">
                    <div 
                        style={{ backgroundColor: (isDefault ? '#eff6ff' : theme.cardBackground) as string }}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accentColor as string} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                            <line x1="12" y1="18" x2="12.01" y2="18" />
                        </svg>
                    </div>

                    <h3 style={{ color: textColor as string }} className="text-2xl font-bold mb-3 tracking-tight">Full details in the app</h3>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        High-resolution field photos, item condition, and purchasing are exclusive to the VNDG MCHN app.
                    </p>

                    <div className="space-y-3">
                        <a 
                            href="#" 
                            style={{ backgroundColor: accentColor as string }}
                            className="block w-full py-4 rounded-xl text-white font-bold shadow-lg shadow-blue-500/20 hover:opacity-90 transition-opacity"
                        >
                            Download the App
                        </a>
                        <button 
                            onClick={onClose}
                            className="block w-full py-3 text-sm font-semibold text-gray-400 hover:text-gray-600"
                        >
                            Continue Browsing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
