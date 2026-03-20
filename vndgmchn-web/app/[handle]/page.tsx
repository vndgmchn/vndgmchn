import { Metadata } from 'next';
import StorefrontShell from '@/components/StorefrontShell';
import { supabase } from '@/lib/supabase';
import { normalizeHandle } from '@/lib/utils';
import { notFound } from 'next/navigation';

type Props = {
    params: Promise<{
        handle: string;
    }>;
    searchParams: Promise<{
        collection?: string;
    }>;
};

// 1. Metadata Generation - More robust to handle missing profiles or RPC errors
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { handle: rawHandle } = await params;
    const handle = normalizeHandle(rawHandle);

    const RESERVED_HANDLES = ['pricing', 'about', 'contact', 'terms', 'privacy', 'api', 'login', 'signup', 'dashboard', 'admin', 'support', 'settings', 'u'];
    if (!handle || RESERVED_HANDLES.includes(handle)) {
        return { title: 'VNDG MCHN Storefront' };
    }

    // We try to get the profile for metadata. 
    // We use the storefront RPC as it's the intended source for profile info.
    const { data: profileRows } = await supabase.rpc('get_storefront_by_handle', {
        p_handle: handle
    });

    const profile = profileRows?.[0];
    if (!profile) {
        return {
            title: 'Storefront | VNDG MCHN',
            description: 'Public storefront on VNDG MCHN.'
        };
    }

    return {
        title: `@${profile.handle} | VNDG MCHN`,
        description: profile.bio || `Check out @${profile.handle}'s public storefront on VNDG MCHN.`,
        openGraph: {
            title: `@${profile.handle} | VNDG MCHN`,
            description: profile.bio || `Check out @${profile.handle}'s public storefront on VNDG MCHN.`,
            images: profile.avatar_url ? [profile.avatar_url] : [],
        }
    };
}

export default async function HandleStorefrontPage({ params, searchParams }: Props) {
    const { handle: rawHandle } = await params;
    const { collection: collectionId } = await searchParams || {};
    const handle = normalizeHandle(rawHandle);
    const RESERVED_HANDLES = ['pricing', 'about', 'contact', 'terms', 'privacy', 'api', 'login', 'signup', 'dashboard', 'admin', 'support', 'settings', 'u'];

    if (!handle || RESERVED_HANDLES.includes(handle)) {
        notFound();
    }

    // Phase 1: Attempt to fetch collections first (matching the last known working path)
    const { data: collections, error: collectionsError } = await supabase.rpc('get_public_collections_by_handle', {
        p_handle: handle
    });

    // Phase 2: If we have collections, extract the profile from the first row (preserves original data shape)
    // This resolves the regression where the manual profile construction was subtly different.
    let profile = (collections?.[0] as any)?.profile;

    // Phase 3: Fallback for zero-collection storefronts
    if (!profile) {
        const { data: profileRows } = await supabase.rpc('get_storefront_by_handle', {
            p_handle: handle
        });

        if (!profileRows || profileRows.length === 0) {
            notFound();
        }

        const firstRow = profileRows[0];
        profile = {
            handle: firstRow.handle,
            display_name: firstRow.display_name,
            bio: firstRow.bio,
            avatar_url: firstRow.avatar_url,
            banner_url: firstRow.banner_url,
            theme_preset: firstRow.theme_preset
        };
    }

    return (
        <StorefrontShell 
            profile={profile} 
            collections={collections || []}
            initialCollectionId={collectionId || null} 
        />
    );
}
