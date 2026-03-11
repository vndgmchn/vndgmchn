import { StorefrontData } from '@/lib/storefront';
import ItemCard from './ItemCard';
import StorefrontHeader from './StorefrontHeader';

type Props = {
  storefront: StorefrontData;
};

export default function StorefrontPage({ storefront }: Props) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <main className="main-container">
      <style>{`
        .main-container {
          padding: 1rem 0.75rem 2rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          max-width: 1280px;
          margin: 0 auto;
          color: #111827;
        }

        .cta-banner {
          background-color: #111827;
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .cta-banner-text {
          font-size: 0.8125rem;
          font-weight: 500;
        }
        
        .cta-banner-btn {
          background-color: white;
          color: #111827;
          border: none;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        @media (min-width: 640px) {
          .main-container {
            padding: 2rem 1.25rem 4rem;
          }
          .cta-banner-text {
            font-size: 0.875rem;
          }
        }
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

      <div className="cta-banner">
        <span className="cta-banner-text">Get the VNDG MCHN app for the best experience</span>
        <button className="cta-banner-btn">Open App</button>
      </div>

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