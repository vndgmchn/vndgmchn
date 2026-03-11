import { StorefrontItem } from '@/lib/storefront';

type Props = {
  item: StorefrontItem;
};

// Simple padding helper for zero-padding purely numeric fields
function padIfNumeric(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return '';
    const s = String(val);
    return /^\d+$/.test(s) ? s.padStart(3, '0') : s;
}

const JA_RARITY_MAP: Record<string, string> = {
  'コモン': 'Common',
  'アンコモン': 'Uncommon',
  'レア': 'Rare',
  'スーパーレア': 'Super Rare',
  'シークレット': 'Secret',
  'シークレットレア': 'Secret Rare',
  'パラレル': 'Parallel',
  'プロモ': 'Promo',
  'リーダー': 'Leader',
  'スペシャルカード': 'Special Card',
  'トリプルレア': 'Triple Rare',
  'ダブルレア': 'Double Rare',
  'ウルトラレア': 'Ultra Rare',
  'スペシャルアートレア': 'Special Art Rare',
  'シークレットスーパーレア': 'Secret Super Rare',
};

// Fallback heuristic: If it is Japanese and the market price is suspiciously large (e.g. >= 1000), 
// it is likely cached in raw JPY. Convert it.
const JPY_TO_USD = Number(process.env.NEXT_PUBLIC_JPY_TO_USD_RATE || process.env.EXPO_PUBLIC_JPY_TO_USD_RATE || 0.00637);

function adjustMarketPrice(price: number | null | undefined, langCode: string | null | undefined): number | null {
  if (typeof price !== 'number' || price === null) return null;
  if (langCode === 'JA' && price >= 1000) {
     return price * JPY_TO_USD;
  }
  return price;
}

function translateRarity(rarity: string | null | undefined): string {
  if (!rarity) return '';
  return JA_RARITY_MAP[rarity] || rarity;
}

export default function ItemCard({ item }: Props) {
  const printedTotal = item.set_printed_total ?? item.set_total;
  const denominator = printedTotal != null ? `/${padIfNumeric(printedTotal)}` : '';
  const setNumberDisplay = item.collector_number ? `${padIfNumeric(item.collector_number)}${denominator}` : '';
  const rarityDisplay = item.rarity ? translateRarity(item.rarity) : '';
  const setNameDisplay = item.language_code === 'JA' && item.set_name_en ? item.set_name_en : item.set_name;
  const adjustedMarketPrice = adjustMarketPrice(item.market_price, item.language_code);
  
  return (
    <>
      <style>{`
        .storefront-item-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .storefront-item-card:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 24px rgba(0,0,0,0.12) !important;
        }

        .item-image-wrapper {
          width: 100%;
          aspect-ratio: 3/4;
          background-color: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.375rem;
          border-bottom: 1px solid #f3f4f6;
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
          borderRadius: '12px', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
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
          <span style={{ color: '#d1d5db', fontSize: '14px', fontWeight: 500, position: 'relative', zIndex: 10 }}>No Image</span>
        )}
      </div>
      <div className="item-content" style={{ padding: 0 }}>
        <div style={{ padding: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#111827', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.title}{item.language_code === 'JA' ? ' (JP)' : ''}
            </h3>
          </div>
          {setNameDisplay && (
            <p style={{ margin: '0 0 0.125rem', fontSize: '0.75rem', color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {setNameDisplay}
            </p>
          )}
          {(setNumberDisplay || rarityDisplay) && (
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {[setNumberDisplay, rarityDisplay].filter(Boolean).join(' • ')}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'auto', gap: '4px' }}>
              {item.kind === 'SEALED' ? (
                  <div style={{ backgroundColor: '#10b981', padding: '2px 6px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#fff', fontWeight: '700', letterSpacing: '0.5px' }}>SEALED</span>
                  </div>
              ) : item.is_graded && item.grading_company && item.grade != null ? (
                  <div style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#374151', fontWeight: '600' }}>{item.grading_company} {item.grade}</span>
                  </div>
              ) : item.condition ? (
                  <div style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#374151', fontWeight: '600' }}>{item.condition}</span>
                  </div>
              ) : null}
              <div style={{ backgroundColor: '#f3f4f6', border: '1px solid transparent', padding: '2px 6px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600' }}>x{item.quantity}</span>
              </div>
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #f3f4f6', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end',
          padding: '0.625rem 0.5rem',
          marginTop: 'auto'
        }}>
          <div>
            {adjustedMarketPrice != null ? (
              <>
                <span style={{ fontSize: '9px', color: '#9ca3af', display: 'block', marginBottom: '1px', fontWeight: 600 }}>MKT</span>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>${adjustedMarketPrice.toFixed(2)}</span>
              </>
            ) : (
                <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>—</span>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '9px', color: '#9ca3af', display: 'block', marginBottom: '1px', fontWeight: 700 }}>BUY</span>
            <strong style={{ fontSize: '17px', color: '#111827', fontWeight: 900, letterSpacing: '-0.5px' }}>
              ${item.listing_price.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
