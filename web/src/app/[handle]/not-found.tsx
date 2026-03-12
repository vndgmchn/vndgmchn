import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Storefront Not Found</h2>
            <p className="text-lg text-gray-600 mb-8 text-center">
                This storefront is private or doesn’t exist
            </p>
            <Link
                href="/"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
                Return Home
            </Link>
        </div>
    );
}
