'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ExamUpdateRedirect() {
    const router = useRouter();
    const { name } = useParams();

    useEffect(() => {
        // Redirect to the main exam page with the updates tab selected
        router.replace(`/exams/${name}?tab=updates`);
    }, [name, router]);

    return (
        <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Redirecting to Exam Hub...</p>
            </div>
        </div>
    );
}
