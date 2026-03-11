type Props = {
  displayName: string;
  handle: string;
  bio: string | null;
};

export default function StorefrontHeader({ displayName, handle, bio }: Props) {
  return (
    <div style={{ 
      marginBottom: '3rem', 
      textAlign: 'center', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
      padding: '2rem 1.5rem',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
    }}>
      <div 
        style={{ 
          width: '96px', height: '96px', borderRadius: '50%', 
          backgroundColor: '#111827', color: '#ffffff', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: '36px', fontWeight: '700', margin: '0 auto 1.5rem',
          boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
          border: '3px solid #ffffff'
        }}
      >
        {displayName ? displayName.charAt(0).toUpperCase() : handle.charAt(0).toUpperCase()}
      </div>
      <h1 style={{ margin: '0 0 0.375rem', fontSize: '2rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.04em' }}>
        {displayName || `@${handle}`}
      </h1>
      <p style={{ margin: '0 0 1.25rem', color: '#6b7280', fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
        @{handle}
      </p>
      {bio && (
        <p style={{ margin: 0, color: '#4b5563', maxWidth: '520px', fontSize: '1rem', lineHeight: 1.6, fontWeight: 400 }}>
          {bio}
        </p>
      )}
    </div>
  );
}
