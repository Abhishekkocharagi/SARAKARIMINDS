'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndexPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/dashboard');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
}
