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
        position: relative;
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
        margin: 0;
      }
      .storefront-share-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        padding: 0.375rem;
        cursor: pointer;
        color: #9ca3af;
        transition: color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .storefront-share-btn:hover {
        color: #4b5563;
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
          margin: 0;
        }
        .storefront-share-btn {
          top: 1.25rem;
          right: 1.25rem;
          padding: 0.5rem;
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
      </div>

      <button 
        onClick={handleShare}
        className="storefront-share-btn"
        title="Share Storefront"
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        )}
      </button>
    </div>
    </>
  );
}
