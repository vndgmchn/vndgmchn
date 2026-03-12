export default function FeaturesPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-10 text-center">Platform Features</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">Real-Time Inventory</h3>
                    <p className="text-gray-500">Track listings natively with built in aggregation logic computing realized profit margins effortlessly.</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">Custom Handles</h3>
                    <p className="text-gray-500">Secure highly readable namespace routes mapping to public web storefront domains bridging the native mobile apps.</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">QR Code Linkages</h3>
                    <p className="text-gray-500">Expose static QR code components embedding native user mapping preventing domain rot when changing store namespaces.</p>
                </div>
            </div>
        </div>
    );
}
