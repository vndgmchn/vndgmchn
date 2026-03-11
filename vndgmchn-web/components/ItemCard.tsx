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
    <div style={{ 
      border: '1px solid #eaeaea', 
      borderRadius: '8px', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        width: '100%', 
        aspectRatio: '3/4', 
        backgroundColor: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.title} 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            loading="lazy"
          />
        ) : (
          <span style={{ color: '#ccc' }}>No Image</span>
        )}
      </div>
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '14px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1 }}>
            {item.title}
          </h3>
          {item.language_code === 'JA' && (
            <div style={{ backgroundColor: '#eaeaea', padding: '1px 4px', borderRadius: '4px', marginLeft: '6px' }}>
              <span style={{ fontSize: '9px', color: '#333', fontWeight: 'bold' }}>JP</span>
            </div>
          )}
        </div>
        {(setNameDisplay || item.collector_number) && (
          <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {setNameDisplay}{setNumberDisplay}{rarityDisplay}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'auto' }}>
            {item.kind === 'SEALED' ? (
                <div style={{ backgroundColor: '#10b981', padding: '1px 4px', borderRadius: '4px', marginRight: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '9px', color: '#fff', fontWeight: 'bold' }}>SEALED</span>
                </div>
            ) : item.is_graded && item.grading_company && item.grade != null ? (
                <div style={{ backgroundColor: '#eaeaea', padding: '1px 4px', borderRadius: '4px', marginRight: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '9px', color: '#333', fontWeight: 'bold' }}>{item.grading_company} {item.grade}</span>
                </div>
            ) : item.condition ? (
                <div style={{ backgroundColor: '#eaeaea', padding: '1px 4px', borderRadius: '4px', marginRight: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '9px', color: '#333', fontWeight: 'bold' }}>{item.condition}</span>
                </div>
            ) : null}
        </div>
        
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '8px' }}>
          <div>
            <span style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '2px' }}>QTY</span>
            <span style={{ fontSize: '12px', color: '#333' }}>{item.quantity}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            {item.market_price != null && (
              <span style={{ fontSize: '11px', color: '#999', marginRight: '8px' }}>
                MKT ${item.market_price.toFixed(2)}
              </span>
            )}
            <strong style={{ fontSize: '16px', color: '#0070f3' }}>
              ${item.listing_price.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
