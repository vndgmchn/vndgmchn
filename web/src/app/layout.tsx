import Link from 'next/link';
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="font-bold text-xl tracking-tight text-blue-600">
                VNDG MCHN
              </Link>
              <nav className="flex space-x-8">
                <Link href="/features" className="text-gray-600 hover:text-gray-900 font-medium">Features</Link>
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</Link>
                <Link href="/faq" className="text-gray-600 hover:text-gray-900 font-medium">FAQ</Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          {children}
        </main>

        <footer className="bg-white border-t border-gray-200 mt-20">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <p className="text-sm text-gray-400">&copy; 2026 VNDG MCHN, LLC. All rights reserved.</p>
            <div className="flex space-x-4">
              <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">Home</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
