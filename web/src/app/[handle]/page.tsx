import StorefrontShell from '@/components/StorefrontShell';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeHandle } from '@/lib/utils';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

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

    const { data: collections, error } = await supabaseAdmin.rpc('get_public_collections_by_handle', {
        handle: handle
    } as any);

    let finalData = collections;
    if (error && error.message.includes('function get_public_collections_by_handle')) {
        const { data: d2 } = await supabaseAdmin.rpc('get_public_collections_by_handle', {
            p_handle: handle
        });
        finalData = d2;
    }

    let profile = (finalData?.[0] as any)?.profile;

    if (!profile) {
        const { data: profileRows } = await supabase.rpc('get_storefront_by_handle', {
            p_handle: handle
        });
        profile = profileRows?.[0];
    }

    if (!profile) {
        return { title: 'Storefront Not Found | VNDG MCHN' };
    }
    return {
        title: `@${profile.handle} | VNDG MCHN`,
        description: profile.bio || `Check out @${profile.handle}'s public storefront on VNDG MCHN.`,
        openGraph: {
            title: `@${profile.handle} | VNDG MCHN`,
            description: profile.bio || `Check out @${profile.handle}'s public storefront on VNDG MCHN.`,
        }
    };
}

export default async function StorefrontPage({ params, searchParams }: Props) {
    const { handle: rawHandle } = await params;
    const { collection: collectionId } = await searchParams;

    const handle = normalizeHandle(rawHandle);
    const RESERVED_HANDLES = ['pricing', 'about', 'contact', 'terms', 'privacy', 'api', 'login', 'signup', 'dashboard', 'admin', 'support', 'settings', 'u'];

    if (!handle || RESERVED_HANDLES.includes(handle)) {
        notFound();
    }

    // Load collections + profile info in one go, trying the correct 'handle' signature first
    const { data: collections, error } = await supabaseAdmin.rpc('get_public_collections_by_handle', {
        handle: handle
    } as any);

    let finalData = collections;
    if (error && error.message.includes('function get_public_collections_by_handle')) {
        const { data: d2 } = await supabaseAdmin.rpc('get_public_collections_by_handle', {
            p_handle: handle
        });
        finalData = d2;
    }

    let profile = (finalData?.[0] as any)?.profile;

    // Fallback: If they have zero public collections, get their profile via the storefront items RPC
    if (!profile) {
        const { data: profileRows } = await supabaseAdmin.rpc('get_storefront_by_handle', {
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
            collections={finalData || []}
            initialCollectionId={collectionId || null} 
        />
    );
}
