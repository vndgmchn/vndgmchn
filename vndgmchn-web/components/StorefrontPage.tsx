import { StorefrontData } from '@/lib/storefront';
import { convertJpyHeuristic, formatUsd } from '@/lib/format';
import StorefrontHeader from './StorefrontHeader';
import StorefrontGrid from './StorefrontGrid';

type Props = {
  storefront: StorefrontData;
};

export default function StorefrontPage({ storefront }: Props) {
  let totalListingValue = 0;
  let totalMarketValue = 0;
  
  storefront.items.forEach(item => {
    const qty = item.quantity || 1;
    totalListingValue += (item.listing_price || 0) * qty;
    totalMarketValue += (convertJpyHeuristic(item.market_price, item.language_code) ?? 0) * qty;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#121212' }}>
      <main className="main-container">
      <style>{`
        .main-container {
          padding: 1rem 0.75rem 2rem;
          max-width: 1280px;
          margin: 0 auto;
          color: #F5F5F5;
        }

        .cta-banner {
          background-color: #1E1E1E;
          color: #F5F5F5;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: none;
        }
        
        .cta-banner-text {
          font-size: 0.8125rem;
          font-weight: 500;
        }
        
        .cta-banner-btn {
          background-color: #F5F5F5;
          color: #121212;
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
          borderBottom: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div>
            <p style={{ margin: '0 0 0.125rem', color: '#A3A3A3', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Listing Value
            </p>
            <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F5F5F5', letterSpacing: '-0.02em' }}>
              {formatUsd(totalListingValue)}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 0.125rem', color: '#A3A3A3', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Market Value
            </p>
            <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F5F5F5', letterSpacing: '-0.02em' }}>
              {formatUsd(totalMarketValue)}
            </p>
          </div>
        </div>

        <div
          style={{
            color: '#A3A3A3',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {storefront.items.length} listing{storefront.items.length !== 1 && 's'}
        </div>
      </section>

      <StorefrontGrid items={storefront.items} />
    </main>
    </div>
  );
}