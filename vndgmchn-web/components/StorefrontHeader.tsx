type Props = {
  displayName: string;
  handle: string;
  bio: string | null;
};

export default function StorefrontHeader({ displayName, handle, bio }: Props) {
  return (
    <div style={{ marginBottom: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div 
        style={{ 
          width: '88px', height: '88px', borderRadius: '50%', 
          backgroundColor: '#111827', color: '#ffffff', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: '32px', fontWeight: '700', margin: '0 auto 1.25rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
          border: '2px solid #ffffff'
        }}
      >
        {displayName ? displayName.charAt(0).toUpperCase() : handle.charAt(0).toUpperCase()}
      </div>
      <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.03em' }}>
        {displayName || `@${handle}`}
      </h1>
      <p style={{ margin: '0 0 1rem', color: '#6b7280', fontSize: '1rem', fontWeight: 500 }}>
        @{handle}
      </p>
      {bio && (
        <p style={{ margin: 0, color: '#4b5563', maxWidth: '480px', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          {bio}
        </p>
      )}
    </div>
  );
}
