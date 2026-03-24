"use client";

import { useState } from 'react';
import SafeImage from './SafeImage';
import { StorefrontTheme } from '@/constants/storefrontThemes';

export default function StorefrontGrid({ items, theme, onItemClick }: { items: any[], theme?: StorefrontTheme, onItemClick?: () => void }) {
    const [numColumns, setNumColumns] = useState(2);
    const isDefault = !theme || theme.id === 'default';

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // UI Colors
    const textColor = isDefault ? '#111827' : theme.textPrimary;
    const priceColor = isDefault ? '#2563eb' : theme.buttonSurface;

    if (items.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">Nothing for sale right now.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Toggle Row */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setNumColumns(2)}
                    style={{ 
                        backgroundColor: (numColumns === 2 ? (isDefault ? '#eff6ff' : theme.buttonSurface) : '#f3f4f6') as string,
                        color: (numColumns === 2 ? (isDefault ? '#1d4ed8' : theme.buttonText) : '#4b5563') as string
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Grid
                </button>
                <button
                    onClick={() => setNumColumns(3)}
                    style={{ 
                        backgroundColor: (numColumns === 3 ? (isDefault ? '#eff6ff' : theme.buttonSurface) : '#f3f4f6') as string,
                        color: (numColumns === 3 ? (isDefault ? '#1d4ed8' : theme.buttonText) : '#4b5563') as string
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Binder
                </button>
            </div>

            <div className={`grid gap-4 sm:gap-6 ${numColumns === 2 ? 'grid-cols-2 sm:grid-cols-2' : 'grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'}`}>
                {items.map((item: any, i: number) => (
                    <button 
                        key={item.item_id || i}
                        onClick={onItemClick}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden text-left hover:shadow-md transition-shadow active:scale-[0.98]"
                    >
                        {/* Image area — dark bg with blurred image behind, matching mobile */}
                        <div
                            className={`w-full relative flex items-center justify-center overflow-hidden ${numColumns === 3 ? 'h-32 sm:h-48' : 'h-48 sm:h-64'}`}
                            style={{ backgroundColor: '#121212' }}
                        >
                            {item.image_url && (
                                <img
                                    src={item.image_url}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                                    style={{ filter: 'blur(12px)', transform: 'scale(1.1)' }}
                                    aria-hidden="true"
                                />
                            )}
                            {item.image_url ? (
                                <SafeImage
                                    src={item.image_url}
                                    alt={item.title}
                                    className="relative z-10 h-[88%] w-auto object-contain drop-shadow-md rounded-md"
                                    loading="lazy"
                                />
                            ) : (
                                <span className={`relative z-10 text-gray-500 font-medium text-center ${numColumns === 3 ? 'text-xs' : 'text-sm'}`}>📸 No Image</span>
                            )}
                        </div>

                        {/* Info */}
                        <div className={`w-full flex-1 flex flex-col justify-between ${numColumns === 3 ? 'p-3' : 'p-4 sm:p-5'}`}>
                            <div>
                                <h3 style={{ color: textColor as string }} className={`font-bold mb-1 truncate ${numColumns === 3 ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`} title={item.title}>{item.title}</h3>
                                {(item.set_name || item.collector_number) && (
                                    <p className={`font-medium text-gray-500 mb-1 truncate ${numColumns === 3 ? 'text-[10px]' : 'text-xs'}`}>
                                        {item.set_name} {item.collector_number ? `#${item.collector_number}` : ''}
                                    </p>
                                )}
                                <p className={`text-gray-500 mb-2 font-medium ${numColumns === 3 ? 'text-[10px]' : 'text-xs'}`}>Qty: {item.quantity}</p>
                            </div>
                            {/* MKT / BUY footer — matches mobile two-label layout */}
                            <div className="mt-auto flex justify-between items-end w-full">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">MKT</p>
                                    <span className={`text-gray-500 font-medium ${numColumns === 3 ? 'text-xs' : 'text-sm'}`}>
                                        {item.market_price ? `$${parseFloat(item.market_price).toFixed(2)}` : '—'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: priceColor as string }}>BUY</p>
                                    <span style={{ color: priceColor as string }} className={`font-extrabold ${numColumns === 3 ? 'text-sm' : 'text-lg sm:text-xl'}`}>
                                        ${parseFloat(item.listing_price || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
