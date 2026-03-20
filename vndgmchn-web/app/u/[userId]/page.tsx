import StorefrontShell from '@/components/StorefrontShell';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

type Props = {
    params: Promise<{
        userId: string;
    }>;
    searchParams: Promise<{
        collection?: string;
    }>;
};

export default async function UserIdStorefrontPage({ params, searchParams }: Props) {
    const { userId } = await params;
    const { collection: collectionId } = await searchParams;

    // Phase 1: Resolve User ID -> Handle/Profile
    // We use the existing RPC to get the basic profile info
    const { data: profileRows, error: profileError } = await supabase.rpc('get_storefront_by_id', {
        p_user_id: userId
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

    // Phase 2: Get Collections by the resolved handle
    const collectionsRes = await supabase.rpc('get_public_collections_by_handle', {
        p_handle: profile.handle
    });
    
    let collections = collectionsRes.data;
    let collectionsError = collectionsRes.error;

    if (collectionsError && collectionsError.message.includes('function get_public_collections_by_handle')) {
        const retryRes = await supabase.rpc('get_public_collections_by_handle', {
            handle: profile.handle
        } as any);
        collections = retryRes.data;
        collectionsError = retryRes.error;
    }

    if (collectionsError || !collections || collections.length === 0) {
        // Even if no collections exist, we should still show the empty shell for that profile
        return (
            <StorefrontShell 
                profile={profile} 
                collections={[]}
                initialCollectionId={null} 
            />
        );
    }

    return (
        <StorefrontShell 
            profile={profile} 
            collections={collections}
            initialCollectionId={collectionId || null} 
        />
    );
}
