import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Storefront Not Found</h1>
      <p style={{ color: '#666', marginTop: '1rem' }}>
        This storefront is either private or doesn't exist.
      </p>
      <Link href="/" style={{ display: 'inline-block', marginTop: '2rem', color: '#0070f3', textDecoration: 'none' }}>
        Return Home
      </Link>
    </div>
  );
}
