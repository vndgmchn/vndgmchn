export default function FAQPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-10 text-center">Frequently Asked Questions</h1>
            <div className="space-y-6">
                <details className="bg-white p-6 rounded-lg text-lg ring-1 ring-gray-200 shadow-sm cursor-pointer group">
                    <summary className="font-semibold text-gray-900 flex justify-between items-center w-full">
                        Can I change my handle later?
                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <p className="mt-4 text-gray-600">Yes! The underlying `u/[id]` namespace statically assigns permanent links ensuring custom namespaces never break QR codes printed on physical collateral.</p>
                </details>
                <details className="bg-white p-6 rounded-lg text-lg ring-1 ring-gray-200 shadow-sm cursor-pointer group">
                    <summary className="font-semibold text-gray-900 flex justify-between items-center w-full">
                        Does the platform take a cut of sales?
                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <p className="mt-4 text-gray-600">No! VNDG MCHN operates strictly as inventory and storefront middleware. We don't act as a payment processor, you coordinate and manage the point of sale transactions natively.</p>
                </details>
                <details className="bg-white p-6 rounded-lg text-lg ring-1 ring-gray-200 shadow-sm cursor-pointer group">
                    <summary className="font-semibold text-gray-900 flex justify-between items-center w-full">
                        Are my private statistics secure?
                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <p className="mt-4 text-gray-600">Absolutely. The public namespace only exposes fields queried safely over Postgres Row Level Securities restricting proprietary values (Cost basis, Sold Price internals).</p>
                </details>
            </div>
        </div>
    );
}
