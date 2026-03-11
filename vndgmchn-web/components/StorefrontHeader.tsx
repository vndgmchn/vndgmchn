type Props = {
    displayName: string;
    handle: string;
    bio: string | null;
  };
  
  export default function StorefrontHeader({ displayName, handle, bio }: Props) {
    return (
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div 
          style={{ 
            width: '80px', height: '80px', borderRadius: '40px', 
            backgroundColor: '#333', color: '#fff', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '32px', fontWeight: 'bold', margin: '0 auto 1rem' 
          }}
        >
          {displayName ? displayName.charAt(0).toUpperCase() : handle.charAt(0).toUpperCase()}
        </div>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '24px' }}>{displayName || `@${handle}`}</h1>
        <p style={{ margin: '0 0 1rem', color: '#666' }}>@{handle}</p>
        {bio && <p style={{ margin: 0, color: '#333', maxWidth: '600px', marginInline: 'auto' }}>{bio}</p>}
      </div>
    );
  }
  
