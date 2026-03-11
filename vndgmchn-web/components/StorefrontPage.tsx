import { StorefrontData } from '@/lib/storefront';
import ItemCard from './ItemCard';
import StorefrontHeader from './StorefrontHeader';

// Helper for safely converting raw JPY cache values to USD for the summary
const JPY_TO_USD = Number(process.env.NEXT_PUBLIC_JPY_TO_USD_RATE || process.env.EXPO_PUBLIC_JPY_TO_USD_RATE || 0.00637);
function getAdjustedMarketPrice(price: number | null | undefined, langCode: string | null | undefined): number {
  if (typeof price !== 'number' || price === null) return 0;
  if (langCode === 'JA' && price >= 1000) return price * JPY_TO_USD;
  return price;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Props = {
  storefront: StorefrontData;
};

export default function StorefrontPage({ storefront }: Props) {
  let totalListingValue = 0;
  let totalMarketValue = 0;
  
  storefront.items.forEach(item => {
    const qty = item.quantity || 1;
    totalListingValue += (item.listing_price || 0) * qty;
    totalMarketValue += getAdjustedMarketPrice(item.market_price, item.language_code) * qty;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <main className="main-container">
      <style>{`
        .main-container {
          padding: 1rem 0.75rem 2rem;
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
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div>
            <p style={{ margin: '0 0 0.125rem', color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Listing Value
            </p>
            <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
              ${formatCurrency(totalListingValue)}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 0.125rem', color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Market Value
            </p>
            <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
              ${formatCurrency(totalMarketValue)}
            </p>
          </div>
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