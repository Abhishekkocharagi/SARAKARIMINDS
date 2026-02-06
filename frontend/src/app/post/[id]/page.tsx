'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import Link from 'next/link';

export default function SinglePostPage() {
    const { id } = useParams();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (id && user) {
            fetchPost();
        }
    }, [id, user, authLoading]);

    const fetchPost = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/posts/${id}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPost(data);
            } else {
                setError('Post not found');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load post');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || (loading && !post)) {
        return (
            <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F3F2EF]">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 pt-24 pb-6 flex justify-center">
                    <div className="bg-white p-8 rounded-xl shadow text-center">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Link href="/" className="text-blue-600 hover:underline font-bold">Back to Feed</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 pt-6 pb-10 flex flex-col md:flex-row gap-6">

                {/* Left Sidebar (Desktop) */}
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                {/* Main Content */}
                <div className="flex-1 max-w-2xl mx-auto">
                    <div className="mb-4">
                        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                            </svg>
                            Back
                        </button>
                    </div>
                    {post && (
                        <PostCard
                            post={post}
                            onDelete={() => router.push('/')}
                        />
                    )}
                </div>

                {/* Right Sidebar Placeholder (Desktop) */}
                <div className="hidden lg:block w-[300px] shrink-0">
                    {/* Could put recommendations here */}
                </div>
            </main>
        </div>
    );
}
