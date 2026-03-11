import { getStorefrontById } from '@/lib/storefront';
import { notFound } from 'next/navigation';
import StorefrontPage from '@/components/StorefrontPage';

type Props = {
    params: Promise<{ userId: string }>;
};

export default async function UserIdStorefrontPage({ params }: Props) {
    const { userId } = await params;
    console.log('[page/u/userId] resolved param:', userId);
    const storefront = await getStorefrontById(userId);

    if (!storefront) {
        notFound();
    }

    return <StorefrontPage storefront={storefront} />;
}
