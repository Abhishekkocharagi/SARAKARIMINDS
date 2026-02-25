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
        console.error('Root Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 tracking-tight italic uppercase italic transform -rotate-1">Something went wrong!</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md font-medium">
                {error.message?.includes('Loading chunk')
                    ? 'A connection issue occurred while loading this page. This often happens if the dev server was restarted or there are multiple servers running on different ports.'
                    : (error.message || 'An unexpected error occurred. Please try again or go back home.')}
            </p>
            {error.message?.includes('Loading chunk') && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl text-blue-700 text-xs font-bold leading-relaxed border border-blue-100">
                    💡 <strong>Tip:</strong> Try a hard refresh (<strong>Ctrl + Shift + R</strong>) or stop all terminals and run <code>npm run dev</code> again.
                </div>
            )}
            <div className="flex gap-4">
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition"
                >
                    Go Home
                </button>
                <button
                    onClick={() => reset()}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
