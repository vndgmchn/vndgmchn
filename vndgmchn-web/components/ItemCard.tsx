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

export default function ItemCard({ item }: Props) {
  const printedTotal = item.set_printed_total ?? item.set_total;
  const denominator = printedTotal != null ? `/${padIfNumeric(printedTotal)}` : '';
  const setNumberDisplay = item.collector_number ? ` • ${padIfNumeric(item.collector_number)}${denominator}` : '';
  const rarityDisplay = item.rarity ? ` • ${item.rarity}` : '';
  const setNameDisplay = item.language_code === 'JA' && item.set_name_en ? item.set_name_en : item.set_name;
  
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
        <div style={{ 
        width: '100%', 
        aspectRatio: '3/4', 
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        borderBottom: '1px solid #f3f4f6'
      }}>
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.title} 
            style={{
              width: '100%',
              height: '260px',
              objectFit: 'contain'
            }}
            loading="lazy"
          />
        ) : (
          <span style={{ color: '#d1d5db', fontSize: '14px', fontWeight: 500 }}>No Image</span>
        )}
      </div>
      <div style={{ padding: '0.875rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#111827', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.title}
          </h3>
          {item.language_code === 'JA' && (
            <div style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', padding: '1px 4px', borderRadius: '4px', marginLeft: '6px', flexShrink: 0 }}>
              <span style={{ fontSize: '10px', color: '#4b5563', fontWeight: '700' }}>JP</span>
            </div>
          )}
        </div>
        {(setNameDisplay || item.collector_number) && (
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {setNameDisplay}{setNumberDisplay}{rarityDisplay}
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
        
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            {item.market_price != null ? (
              <>
                <span style={{ fontSize: '9px', color: '#9ca3af', display: 'block', marginBottom: '1px', fontWeight: 600 }}>MKT</span>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>${item.market_price.toFixed(2)}</span>
              </>
            ) : (
                <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>—</span>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '9px', color: '#9ca3af', display: 'block', marginBottom: '1px', fontWeight: 600 }}>BUY</span>
            <strong style={{ fontSize: '16px', color: '#2563eb', fontWeight: 800, letterSpacing: '-0.5px' }}>
              ${item.listing_price.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
