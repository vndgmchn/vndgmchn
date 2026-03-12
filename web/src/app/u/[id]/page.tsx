import { supabase } from '@/lib/supabase';
import { notFound, redirect } from 'next/navigation';

type Props = {
    params?: Promise<{
        id?: string | string[];
    }> | {
        id?: string | string[];
    };
};

export default async function UserRedirectPage({ params }: Props) {
    const resolvedParams = await params;

    if (!resolvedParams?.id) {
        notFound();
    }

    const rawId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;

    if (typeof rawId !== 'string') {
        notFound();
    }

    const id = rawId.trim();

    if (!id) {
        notFound();
    }
    // Validate UUID format before RPC call to prevent Postgres errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        notFound();
    }

    // Call Supabase RPC to find storefront by uuid
    const { data: storefrontRows, error } = await supabase.rpc('get_storefront_by_id', {
        p_user_id: id
    });

    let finalData = storefrontRows;
    if (error && error.message.includes('function get_storefront_by_id')) {
        const { data: d2 } = await supabase.rpc('get_storefront_by_id', {
            user_id: id
        });
        finalData = d2;
    }

    if (error || !finalData || finalData.length === 0) {
        notFound();
    }

    // Identify handle of the profile and execute an immediate redirect
    const handle = finalData[0].handle;

    if (handle) {
        redirect(`/${handle}`);
    } else {
        notFound();
    }
}
