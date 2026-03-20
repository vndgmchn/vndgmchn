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

export async function generateMetadata({ params }: { params: Props['params'] }) {
    const { handle: rawHandle } = await params;
    const handle = normalizeHandle(rawHandle);

    const RESERVED_HANDLES = ['pricing', 'about', 'contact', 'terms', 'privacy', 'api', 'login', 'signup', 'dashboard', 'admin', 'support', 'settings', 'u'];
    if (!handle || RESERVED_HANDLES.includes(handle)) return { title: 'VNDG MCHN Storefront' };

    const { data: profileRows, error: profileError } = await supabase.rpc('get_storefront_by_handle', {
        p_handle: handle
    });

    if (profileError || !profileRows || profileRows.length === 0) {
        return { title: 'Storefront Not Found | VNDG MCHN' };
    }

    const profile = profileRows[0];
    return {
        title: `@${profile.handle} | VNDG MCHN`,
        description: profile.bio || `Check out @${profile.handle}'s public storefront on VNDG MCHN.`,
        openGraph: {
            title: `@${profile.handle} | VNDG MCHN`,
            description: profile.bio || `Check out @${profile.handle}'s public storefront on VNDG MCHN.`,
        }
    };
}

export default async function HandleStorefrontPage({ params, searchParams }: Props) {
    const { handle: rawHandle } = await params;
    const { collection: collectionId } = await searchParams;

    const handle = normalizeHandle(rawHandle);
    const RESERVED_HANDLES = ['pricing', 'about', 'contact', 'terms', 'privacy', 'api', 'login', 'signup', 'dashboard', 'admin', 'support', 'settings', 'u'];

    if (!handle || RESERVED_HANDLES.includes(handle)) {
        notFound();
    }

    // Phase 1: Verify profile existence
    const { data: profileRows, error: profileError } = await supabase.rpc('get_storefront_by_handle', {
        p_handle: handle
    });

    if (profileError || !profileRows || profileRows.length === 0) {
        notFound();
    }

    const firstRow = profileRows[0];
    const profile = {
        handle: firstRow.handle,
        display_name: firstRow.display_name,
        bio: firstRow.bio,
        avatar_url: firstRow.avatar_url,
        banner_url: firstRow.banner_url,
        theme_preset: firstRow.theme_preset
    };

    // Phase 2: Get Collections
    const { data: collections } = await supabase.rpc('get_public_collections_by_handle', {
        p_handle: handle
    });

    return (
        <StorefrontShell 
            profile={profile} 
            collections={collections || []}
            initialCollectionId={collectionId || null} 
        />
    );
}
