import { StorefrontData } from '@/lib/storefront';
import ItemCard from './ItemCard';
import StorefrontHeader from './StorefrontHeader';

type Props = {
  storefront: StorefrontData;
};

export default function StorefrontPage({ storefront }: Props) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <main
        style={{
          padding: '2rem 1.25rem 4rem',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          maxWidth: '1280px',
          margin: '0 auto',
          color: '#111827',
        }}
      >
      <style>{`
        .storefront-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media (min-width: 640px) {
          .storefront-grid {
            gap: 1.5rem;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .storefront-grid {
            gap: 1.5rem;
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (min-width: 1280px) {
          .storefront-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
        }
      `}</style>

      <StorefrontHeader
        displayName={storefront.display_name}
        handle={storefront.handle}
        bio={storefront.bio}
      />

      <section
        style={{
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              margin: '0 0 0.25rem',
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#111827',
            }}
          >
            Inventory
          </h2>
          <p
            style={{
              margin: 0,
              color: '#4b5563',
              fontSize: '0.9375rem',
              fontWeight: 500,
            }}
          >
            Public storefront listings
          </p>
        </div>

        <div
          style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {storefront.items.length} listing{storefront.items.length !== 1 && 's'}
        </div>
      </section>

      <div className="storefront-grid">
        {storefront.items.map((item) => (
          <ItemCard key={item.item_id} item={item} />
        ))}
      </div>
    </main>
    </div>
  );
}