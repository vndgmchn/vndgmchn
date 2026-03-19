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

    const { data: collections } = await supabase.rpc('get_public_collections_by_handle', {
        p_handle: handle
    });

    if (!collections || collections.length === 0) {
        return { title: 'Storefront Not Found | VNDG MCHN' };
    }

    const profile = collections[0].profile;
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

    // Load collections + profile info in one go
    const { data: collections, error } = await supabase.rpc('get_public_collections_by_handle', {
        p_handle: handle
    });

    if (error || !collections || collections.length === 0) {
        // Fallback for case sensitivity or missing function
        const { data: d2 } = await supabase.rpc('get_public_collections_by_handle', {
            handle: handle
        });
        
        if (!d2 || d2.length === 0) {
            notFound();
        }
        
        const profile = d2[0].profile;
        return (
            <StorefrontShell 
                profile={profile} 
                collections={d2}
                initialCollectionId={collectionId || null} 
            />
        );
    }

    const profile = collections[0].profile;

    return (
        <StorefrontShell 
            profile={profile} 
            collections={collections}
            initialCollectionId={collectionId || null} 
        />
    );
}
