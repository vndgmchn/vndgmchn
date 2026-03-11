type Props = {
  displayName: string;
  handle: string;
  bio: string | null;
};

export default function StorefrontHeader({ displayName, handle, bio }: Props) {
  return (
    <>
    <style>{`
      .storefront-header-card {
        margin-bottom: 1.5rem;
        padding: 1.5rem 1rem;
      }
      .storefront-avatar {
        width: 72px;
        height: 72px;
        font-size: 28px;
        margin: 0 auto 1rem;
      }
      .storefront-title {
        font-size: 1.5rem;
        margin: 0 0 0.25rem;
      }
      .storefront-handle {
        font-size: 0.9375rem;
        margin: 0 0 0.875rem;
      }
      .storefront-bio {
        font-size: 0.9375rem;
      }

      @media (min-width: 640px) {
        .storefront-header-card {
          margin-bottom: 3rem;
          padding: 2rem 1.5rem;
        }
        .storefront-avatar {
          width: 96px;
          height: 96px;
          font-size: 36px;
          margin: 0 auto 1.5rem;
        }
        .storefront-title {
          font-size: 2rem;
          margin: 0 0 0.375rem;
        }
        .storefront-handle {
          font-size: 1.0625rem;
          margin: 0 0 1.25rem;
        }
        .storefront-bio {
          font-size: 1rem;
        }
      }
    `}</style>
    <div 
      className="storefront-header-card"
      style={{ 
      textAlign: 'center', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
    }}>
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
      <h1 className="storefront-title" style={{ fontWeight: '800', color: '#111827', letterSpacing: '-0.04em' }}>
        {displayName || `@${handle}`}
      </h1>
      <p className="storefront-handle" style={{ color: '#6b7280', fontWeight: 600, letterSpacing: '-0.01em' }}>
        @{handle}
      </p>
      {bio && (
        <p className="storefront-bio" style={{ margin: 0, color: '#4b5563', maxWidth: '520px', lineHeight: 1.6, fontWeight: 400 }}>
          {bio}
        </p>
      )}
    </div>
    </>
  );
}
