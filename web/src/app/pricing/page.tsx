export default function PricingPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Simple, transparent pricing</h1>
            <p className="text-xl text-gray-500 mb-12">No hidden fees, no volume caps. Just one plan to rule them all.</p>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 max-w-lg mx-auto">
                <div className="p-8 bg-blue-600">
                    <h3 className="text-2xl font-bold text-white mb-2">Pro Seller</h3>
                    <p className="text-blue-100 text-sm">Everything you need to run your business</p>
                    <div className="mt-6">
                        <span className="text-5xl font-extrabold text-white">$29</span>
                        <span className="text-xl font-medium text-blue-100">/mo</span>
                    </div>
                </div>
                <div className="p-8 text-left bg-white">
                    <ul className="space-y-4">
                        <li className="flex items-center text-gray-600">
                            <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            Unlimited active listings
                        </li>
                        <li className="flex items-center text-gray-600">
                            <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            Custom storefront domain mapping
                        </li>
                        <li className="flex items-center text-gray-600">
                            <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            Real-time analytics dashboard
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
