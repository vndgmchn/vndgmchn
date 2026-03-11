import { getStorefrontByHandle } from '@/lib/storefront';
import { notFound } from 'next/navigation';
import StorefrontPage from '@/components/StorefrontPage';

type Props = {
    params: Promise<{ handle: string }>;
};

export default async function HandleStorefrontPage({ params }: Props) {
    const { handle } = await params;
    console.log('[page/handle] resolved param:', handle);
    const storefront = await getStorefrontByHandle(handle);

    if (!storefront) {
        notFound();
    }

    return <StorefrontPage storefront={storefront} />;
}
