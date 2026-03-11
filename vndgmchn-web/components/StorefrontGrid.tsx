'use client';

import { useState, useMemo } from 'react';
import { StorefrontItem } from '@/lib/storefront';
import ItemCard from './ItemCard';

type Props = {
  items: StorefrontItem[];
};

export default function StorefrontGrid({ items }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CARDS' | 'SEALED'>('ALL');
  const [filterLang, setFilterLang] = useState<'ALL' | 'EN' | 'JP'>('ALL');
  const [sortBy, setSortBy] = useState<'RECENT' | 'PRICE_HIGH_LOW' | 'PRICE_LOW_HIGH' | 'NAME_AZ'>('RECENT');

  const sortedItems = useMemo(() => {
    let filtered = items;

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(i => {
        const matchTitle = i.title?.toLowerCase().includes(lowerQuery);
        const matchSet = i.set_name?.toLowerCase().includes(lowerQuery) || i.set_name_en?.toLowerCase().includes(lowerQuery);
        return matchTitle || matchSet;
      });
    }

    if (filterType !== 'ALL') {
      const targetKind = 'SEALED';
      filtered = filtered.filter(i => filterType === 'SEALED' 
        ? i.kind === targetKind 
        : i.kind !== targetKind
      );
    }

    if (filterLang !== 'ALL') {
      const jaCode = 'JA';
      filtered = filtered.filter(i => filterLang === 'JP'
        ? i.language_code === jaCode
        : i.language_code !== jaCode
      );
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'PRICE_HIGH_LOW' || sortBy === 'PRICE_LOW_HIGH') {
        const priceA = a.listing_price || 0;
        const priceB = b.listing_price || 0;
        return sortBy === 'PRICE_HIGH_LOW' ? priceB - priceA : priceA - priceB;
      }
      if (sortBy === 'NAME_AZ') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0; // RECENT keeps original ordering safely
    });
  }, [items, searchQuery, filterType, filterLang, sortBy]);

  return (
    <div>
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

        .controls-container {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .search-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background-color: #ffffff;
          font-size: 0.9375rem;
          outline: none;
          transition: border-color 0.2s;
          color: #111827;
        }
        
        .search-input:focus {
          border-color: #10b981;
        }
        
        .filters-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
          justify-content: space-between;
        }
        
        .pill-group {
          display: flex;
          background-color: #e5e7eb;
          border-radius: 8px;
          padding: 3px;
          overflow: hidden;
        }
        
        .pill {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          color: #4b5563;
          border: none;
          background: transparent;
          transition: all 0.2s ease;
        }
        
        .pill.active {
          background-color: #ffffff;
          color: #111827;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .sort-select {
          padding: 0.45rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background-color: #ffffff;
          color: #111827;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 0.7rem top 50%;
          background-size: 0.65rem auto;
          padding-right: 2rem;
          outline: none;
        }
        
        .sort-select:focus {
          border-color: #10b981;
        }
        
        .empty-state {
          padding: 4rem 1rem;
          text-align: center;
          color: #6b7280;
          background: #ffffff;
          border-radius: 12px;
          border: 1px dashed #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
      `}</style>
      
      <div className="controls-container">
        <input 
          type="search" 
          placeholder="Search listings..." 
          className="search-input"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div className="filters-row">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="pill-group">
              {(['ALL', 'CARDS', 'SEALED'] as const).map(type => (
                <button
                  key={type}
                  className={`pill ${filterType === type ? 'active' : ''}`}
                  onClick={() => setFilterType(type)}
                >
                  {type === 'ALL' ? 'All Types' : type === 'CARDS' ? 'Cards' : 'Sealed'}
                </button>
              ))}
            </div>
            <div className="pill-group">
              {(['ALL', 'EN', 'JP'] as const).map(lang => (
                <button
                  key={lang}
                  className={`pill ${filterLang === lang ? 'active' : ''}`}
                  onClick={() => setFilterLang(lang)}
                >
                  {lang === 'ALL' ? 'All Langs' : lang === 'EN' ? 'EN' : 'JP'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <select 
              className="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'RECENT' | 'PRICE_HIGH_LOW' | 'PRICE_LOW_HIGH' | 'NAME_AZ')}
            >
              <option value="RECENT">Recent</option>
              <option value="PRICE_HIGH_LOW">Price: High to Low</option>
              <option value="PRICE_LOW_HIGH">Price: Low to High</option>
              <option value="NAME_AZ">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {sortedItems.length > 0 ? (
        <div className="storefront-grid">
          {sortedItems.map((item) => (
            <ItemCard key={item.item_id} item={item} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 500 }}>No listings found matching your search.</p>
        </div>
      )}
    </div>
  );
}
