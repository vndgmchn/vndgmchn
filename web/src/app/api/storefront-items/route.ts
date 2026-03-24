import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const collectionId = request.nextUrl.searchParams.get('collection_id');

    if (!collectionId) {
        return NextResponse.json({ error: 'collection_id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc('get_public_collection_items', {
        p_collection_id: collectionId
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
}
