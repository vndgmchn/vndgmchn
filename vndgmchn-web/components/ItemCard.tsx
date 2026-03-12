import { StorefrontItem } from '@/lib/storefront';
import { convertJpyHeuristic, displayRarity, formatCollectorNumber, formatUsd } from '@/lib/format';

type Props = {
  item: StorefrontItem;
};


export default function ItemCard({ item }: Props) {
  const printedTotal = item.set_printed_total ?? item.set_total;
  const setNumberDisplay = formatCollectorNumber(item.collector_number, printedTotal);
  const rarityDisplay = item.rarity ? displayRarity(item.rarity) : '';
  const setNameDisplay = item.language_code === 'JA' && item.set_name_en ? item.set_name_en : item.set_name;
  const adjustedMarketPrice = convertJpyHeuristic(item.market_price, item.language_code);
  
  return (
    <>
      <style>{`
        .storefront-item-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .storefront-item-card:hover {
          transform: translateY(-2px) !important;
        }

        .item-image-wrapper {
          width: 100%;
          aspect-ratio: 3/4;
          background-color: #121212;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.375rem;
          border-bottom: none;
          position: relative;
          overflow: hidden;
        }
        .item-image-blur {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          object-fit: cover;
          filter: blur(16px);
          opacity: 0.20;
          transform: scale(1.15);
          z-index: 0;
          pointer-events: none;
        }
        .item-image {
          width: 100%;
          height: 100%;
          max-height: 180px;
          object-fit: contain;
          position: relative;
          z-index: 10;
        }
        .item-content {
          padding: 0.625rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        @media (min-width: 640px) {
          .item-image-wrapper {
            padding: 0.5rem;
          }
          .item-image {
            max-height: 260px;
          }
          .item-content {
            padding: 0.875rem;
          }
        }
      `}</style>
      <div 
        className="storefront-item-card"
        style={{ 
          borderRadius: '6px', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1E1E1E',
          border: 'none',
          boxShadow: 'none',
          cursor: 'pointer'
        }}
      >
        <div className="item-image-wrapper">
        {item.image_url && (
          <img 
            src={item.image_url} 
            alt="" 
            className="item-image-blur"
            loading="lazy"
            aria-hidden="true"
          />
        )}
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.title} 
            className="item-image"
            loading="lazy"
          />
        ) : (
          <span style={{ color: '#A3A3A3', fontSize: '14px', fontWeight: 500, position: 'relative', zIndex: 10 }}>No Image</span>
        )}
      </div>
      <div className="item-content" style={{ padding: 0 }}>
        <div style={{ padding: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#F5F5F5', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.title}{item.language_code === 'JA' ? ' (JP)' : ''}
            </h3>
          </div>
          {setNameDisplay && (
            <p style={{ margin: '0 0 0.125rem', fontSize: '0.75rem', color: '#A3A3A3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {setNameDisplay}
            </p>
          )}
          {(setNumberDisplay || rarityDisplay) && (
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#A3A3A3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {[setNumberDisplay, rarityDisplay].filter(Boolean).join(' • ')}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'auto', gap: '4px' }}>
              {item.kind === 'SEALED' ? (
                  <div style={{ backgroundColor: '#10b981', padding: '2px 6px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#fff', fontWeight: '700', letterSpacing: '0.5px' }}>SEALED</span>
                  </div>
              ) : item.is_graded && item.grading_company && item.grade != null ? (
                  <div style={{ backgroundColor: '#121212', border: 'none', padding: '2px 6px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#A3A3A3', fontWeight: '600' }}>{item.grading_company} {item.grade}</span>
                  </div>
              ) : item.condition ? (
                  <div style={{ backgroundColor: '#121212', border: 'none', padding: '2px 6px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#A3A3A3', fontWeight: '600' }}>{item.condition}</span>
                  </div>
              ) : null}
              <div style={{ backgroundColor: '#121212', border: 'none', padding: '2px 6px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#A3A3A3', fontWeight: '600' }}>x{item.quantity}</span>
              </div>
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: '#1E1E1E',
          borderTop: 'none', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end',
          padding: '0.625rem 0.5rem',
          marginTop: 'auto'
        }}>
          <div>
            {adjustedMarketPrice != null ? (
              <>
                <span style={{ fontSize: '9px', color: '#A3A3A3', display: 'block', marginBottom: '1px', fontWeight: 600 }}>MKT</span>
                <span style={{ fontSize: '12px', color: '#A3A3A3', fontWeight: 600 }}>${adjustedMarketPrice.toFixed(2)}</span>
              </>
            ) : (
                <span style={{ fontSize: '12px', color: '#A3A3A3', display: 'block' }}>—</span>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '9px', color: '#A3A3A3', display: 'block', marginBottom: '1px', fontWeight: 700 }}>BUY</span>
            <strong style={{ fontSize: '17px', color: '#F5F5F5', fontWeight: 900, letterSpacing: '-0.5px' }}>
              ${item.listing_price.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
