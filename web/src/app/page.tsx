import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl mb-6">
        Your Mobile Storefront,<br />
        <span className="text-blue-600">Reimagined.</span>
      </h1>
      <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto mb-10">
        VNDG MCHN powers automated inventory, real-time performance tracking, and immediate consumer-facing storefront capabilities out of the box.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          href="/pricing"
          className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
        >
          Get Started
        </Link>
        <Link
          href="/features"
          className="px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
        >
          View Features
        </Link>
      </div>
    </div>
  );
}
