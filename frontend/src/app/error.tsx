'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-lg w-full text-center border border-gray-100">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">⚠️</div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Something went wrong!</h2>
                <p className="text-gray-500 font-medium mb-8">
                    {error.message || "An unexpected error occurred while rendering this page."}
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-4 rounded-2xl transition uppercase text-xs tracking-widest"
                    >
                        Go Home
                    </button>
                    <button
                        onClick={() => reset()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-blue-600/20 uppercase text-xs tracking-widest"
                    >
                        Try again
                    </button>
                </div>
            </div>
        </div>
    );
}
