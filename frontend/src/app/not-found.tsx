import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-lg w-full text-center border border-gray-100">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">🔍</div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">404 - Not Found</h2>
                <p className="text-gray-500 font-medium mb-8">
                    The page you are looking for might have been moved or doesn't exist.
                </p>
                <Link
                    href="/"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-4 rounded-2xl transition shadow-lg shadow-blue-600/20 uppercase text-xs tracking-widest"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}
