'use client';

import { useState } from 'react';

type Props = {
  displayName: string;
  handle: string;
  bio: string | null;
};

export default function StorefrontHeader({ displayName, handle, bio }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: displayName || `@${handle}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // User likely cancelled share, safely ignore
    }
  };

  return (
    <>
    <style>{`
      .storefront-header-card {
        margin-bottom: 1.5rem;
        padding: 1.25rem 1rem;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 1rem;
      }
      .storefront-avatar {
        width: 76px;
        height: 76px;
        font-size: 28px;
        flex-shrink: 0;
      }
      .storefront-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
      }
      .storefront-title {
        font-size: 1.25rem;
        margin: 0 0 0.125rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .storefront-handle {
        font-size: 0.875rem;
        margin: 0 0 0.5rem;
      }
      .storefront-bio {
        font-size: 0.875rem;
        margin: 0 0 0.75rem;
      }
      .storefront-share-btn {
        align-self: flex-start;
        padding: 0.375rem 0.875rem;
        font-size: 0.8125rem;
      }

      @media (min-width: 640px) {
        .storefront-header-card {
          margin-bottom: 2.5rem;
          padding: 1.75rem 1.5rem;
          gap: 1.5rem;
        }
        .storefront-avatar {
          width: 100px;
          height: 100px;
          font-size: 36px;
        }
        .storefront-title {
          font-size: 1.5rem;
        }
        .storefront-handle {
          font-size: 1rem;
          margin: 0 0 0.75rem;
        }
        .storefront-bio {
          font-size: 0.9375rem;
          margin: 0 0 1rem;
        }
        .storefront-share-btn {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }
      }
    `}</style>
    <div 
      className="storefront-header-card"
      style={{ 
      background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
    }}>
      {/* Left: Avatar */}
      <div 
        className="storefront-avatar"
        style={{ 
          borderRadius: '50%', 
          backgroundColor: '#111827', color: '#ffffff', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontWeight: '700',
          boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
          border: '3px solid #ffffff'
        }}
      >
        {displayName ? displayName.charAt(0).toUpperCase() : handle.charAt(0).toUpperCase()}
      </div>

      {/* Right: Content */}
      <div className="storefront-content">
        <h1 className="storefront-title" style={{ fontWeight: '800', color: '#111827', letterSpacing: '-0.04em' }}>
          {displayName || `@${handle}`}
        </h1>
        <p className="storefront-handle" style={{ color: '#6b7280', fontWeight: 600, letterSpacing: '-0.01em' }}>
          @{handle}
        </p>
        
        {bio && (
          <p className="storefront-bio" style={{ color: '#4b5563', lineHeight: 1.5, fontWeight: 400 }}>
            {bio}
          </p>
        )}

        <button 
          onClick={handleShare}
          className="storefront-share-btn"
          style={{
            backgroundColor: copied ? '#10b981' : '#f3f4f6',
            color: copied ? '#ffffff' : '#374151',
            border: copied ? '1px solid #10b981' : '1px solid #e5e7eb',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '70px'
          }}
        >
          {copied ? 'Copied' : 'Share'}
        </button>
      </div>
    </div>
    </>
  );
}
