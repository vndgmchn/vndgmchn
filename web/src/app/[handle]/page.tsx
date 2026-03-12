import StorefrontGrid from '@/components/StorefrontGrid';
import { supabase } from '@/lib/supabase';
import { normalizeHandle } from '@/lib/utils';
import { notFound } from 'next/navigation';

type Props = {
    params?: Promise<{
        handle?: string | string[];
    }> | {
        handle?: string | string[];
    };
};

export async function generateMetadata({ params }: Props) {
    const resolvedParams = await params;

    if (!resolvedParams?.handle) return { title: 'VNDG MCHN Storefront' };

    const rawHandle = Array.isArray(resolvedParams.handle) ? resolvedParams.handle[0] : resolvedParams.handle;
    const handle = normalizeHandle(rawHandle);

    const RESERVED_HANDLES = ['pricing', 'about', 'contact', 'terms', 'privacy', 'api', 'login', 'signup', 'dashboard', 'admin', 'support', 'settings', 'u'];

    if (!handle || RESERVED_HANDLES.includes(handle)) return { title: 'VNDG MCHN Storefront' };

    const { data: storefrontRows } = await supabase.rpc('get_storefront_by_handle', {
        p_handle: handle
    });

    if (!storefrontRows || storefrontRows.length === 0) {
        return { title: 'Storefront Not Found | VNDG MCHN' };
    }

    const profile = storefrontRows[0];

    return {
        title: `@${profile.handle} | VNDG MCHN`,
        description: profile.bio || `Check out @${profile.handle}'s public storefront on VNDG MCHN.`,
        openGraph: {
            title: `@${profile.handle} | VNDG MCHN`,
            description: profile.bio || `Check out @${profile.handle}'s public storefront on VNDG MCHN.`,
        }
    };
}

// Next.js page component receives params dynamically based on the folder structure [handle]
export default async function StorefrontPage({ params }: Props) {
    const resolvedParams = await params;
    if (!resolvedParams?.handle) {
        notFound();
    }

    const rawHandle = Array.isArray(resolvedParams.handle) ? resolvedParams.handle[0] : resolvedParams.handle;

    if (typeof rawHandle !== 'string') {
        notFound();
    }

    const handle = normalizeHandle(rawHandle);

    const RESERVED_HANDLES = ['pricing', 'about', 'contact', 'terms', 'privacy', 'api', 'login', 'signup', 'dashboard', 'admin', 'support', 'settings', 'u'];

    if (!handle || RESERVED_HANDLES.includes(handle)) {
        notFound();
    }

    const { data: storefrontRows, error } = await supabase.rpc('get_storefront_by_handle', {
        p_handle: handle
    });

    let finalData = storefrontRows;
    if (error && error.message.includes('function get_storefront_by_handle')) {
        const { data: d2 } = await supabase.rpc('get_storefront_by_handle', {
            handle: handle
        });
        finalData = d2;
    }

    if (!finalData || finalData.length === 0) {
        notFound();
    }

    const profile = finalData[0];
    const validItems = finalData.filter((row: any) => row.item_id);

    // Compute Math Totals matching Mobile
    const totalListValue = validItems.reduce((acc: number, current: any) => acc + ((parseFloat(current.listing_price) || 0) * (current.quantity || 1)), 0);
    const totalMarketValue = validItems.reduce((acc: number, current: any) => acc + ((parseFloat(current.market_price) || 0) * (current.quantity || 1)), 0);

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="bg-blue-600 h-24 sm:h-32"></div>
                <div className="px-6 pb-6 relative">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center absolute -top-12 sm:-top-16 shadow-md text-blue-600 font-bold text-3xl">
                        {profile.display_name ? profile.display_name.charAt(0).toUpperCase() : profile.handle.charAt(0).toUpperCase()}
                    </div>
                    <div className="mt-14 sm:mt-18">
                        <h1 className="text-3xl font-extrabold text-gray-900">{profile.display_name || `@${profile.handle}`}</h1>
                        <p className="text-lg text-gray-500 font-medium">@{profile.handle}</p>
                        {profile.bio && (
                            <p className="mt-4 text-gray-700 max-w-2xl">{profile.bio}</p>
                        )}

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mt-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                Public Storefront
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                {validItems.length} For Sale
                            </span>
                        </div>

                        {/* Aggregates Dashboard */}
                        <div className="mt-8 flex flex-col sm:flex-row border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                            <div className="flex-1 p-4 sm:p-6 text-center border-b sm:border-b-0 sm:border-r border-gray-200">
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Listing Value</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalListValue)}</p>
                            </div>
                            <div className="flex-1 p-4 sm:p-6 text-center bg-gray-50">
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Market Value</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalMarketValue > 0 ? formatCurrency(totalMarketValue) : '--'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Items ({validItems.length})</h2>
                <StorefrontGrid items={validItems} />
            </div>
        </div>
    );
}
