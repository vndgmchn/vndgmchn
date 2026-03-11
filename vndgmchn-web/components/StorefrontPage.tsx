import { StorefrontData } from '@/lib/storefront';
import StorefrontHeader from './StorefrontHeader';
import ItemCard from './ItemCard';

type Props = {
  storefront: StorefrontData;
};

export default function StorefrontPage({ storefront }: Props) {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <StorefrontHeader 
        displayName={storefront.display_name} 
        handle={storefront.handle} 
        bio={storefront.bio} 
      />
      
      <hr style={{ border: 'none', borderTop: '1px solid #eaeaea', margin: '2rem 0' }} />
      
      <div style={{ marginBottom: '1.5rem', color: '#666', fontSize: '14px' }}>
        <strong>{storefront.items.length}</strong> item{storefront.items.length !== 1 && 's'} for sale
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {storefront.items.map((item) => (
          <ItemCard key={item.item_id} item={item} />
        ))}
      </div>
    </main>
  );
}
