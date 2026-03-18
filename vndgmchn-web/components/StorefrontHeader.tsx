'use client';

import { useState } from 'react';
import { getThemePreset } from '@/lib/storefrontThemes';

type Props = {
  displayName: string;
  handle: string;
  bio: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  themePreset?: string | null;
};

export default function StorefrontHeader({ displayName, handle, bio, avatarUrl, bannerUrl, themePreset }: Props) {
  const [copied, setCopied] = useState(false);
  const preset = getThemePreset(themePreset);
  const isDefault = preset.id === 'default';

  // Apply preset colors or fall back to defaults
  const cardBg = preset.cardBackground || '#1E1E1E';
  const textPrimary = preset.textPrimary || '#F5F5F5';
  const textSecondary = preset.textSecondary || '#A3A3A3';

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
      .storefront-banner {
        width: 100%;
        height: 120px;
        object-fit: cover;
        border-radius: 12px;
        display: block;
      }
      .storefront-header-card {
        margin-top: -2.75rem;
        margin-left: 0.75rem;
        margin-right: 0.75rem;
        margin-bottom: 2rem;
        padding: 1rem;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 1rem;
        position: relative;
        border-radius: 1rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .storefront-avatar {
        width: 76px;
        height: 76px;
        font-size: 28px;
        flex-shrink: 0;
        border-radius: 50%;
        overflow: hidden;
        object-fit: cover;
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
        color: ${textSecondary};
        transition: color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .storefront-share-btn:hover {
        color: ${textPrimary};
      }

      @media (min-width: 640px) {
        .storefront-banner {
          height: 200px;
          border-radius: 16px;
        }
        .storefront-header-card {
          margin-top: -3.5rem;
          margin-left: 1.5rem;
          margin-right: 1.5rem;
          margin-bottom: 3rem;
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

    <div style={{ position: 'relative', marginBottom: 0 }}>
      {/* Banner */}
      <div style={{ backgroundColor: '#1E1E1E', borderRadius: '12px', overflow: 'hidden' }}>
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt="Storefront banner"
            className="storefront-banner"
          />
        ) : (
          <div className="storefront-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1E1E1E' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          </div>
        )}
      </div>

      <div
        className="storefront-header-card"
        style={{ backgroundColor: cardBg }}
      >
        {/* Left: Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName || handle}
            className="storefront-avatar"
          />
        ) : (
          <div
            className="storefront-avatar"
            style={{
              backgroundColor: isDefault ? '#121212' : textPrimary, 
              color: isDefault ? '#F5F5F5' : cardBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700',
            }}
          >
            {displayName ? displayName.charAt(0).toUpperCase() : handle.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Right: Content */}
        <div className="storefront-content">
          <h1 className="storefront-title" style={{ fontWeight: '800', color: textPrimary, letterSpacing: '-0.04em' }}>
            {displayName || `@${handle}`}
          </h1>
          <p className="storefront-handle" style={{ color: textSecondary, fontWeight: 600, letterSpacing: '-0.01em' }}>
            @{handle}
          </p>

          {bio && (
            <p className="storefront-bio" style={{ color: textPrimary, lineHeight: 1.5, fontWeight: 400 }}>
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
    </div>
    </>
  );
}
