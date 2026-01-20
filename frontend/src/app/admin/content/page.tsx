'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Post {
    _id: string;
    content: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
    mediaUrl?: string;
    mediaType?: string;
    createdAt: string;
}

export default function AdminContent() {
    const { user: currentUser } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser?.token) {
            fetchPosts();
        }
    }, [currentUser]);

    const fetchPosts = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/content', {
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/content/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentUser?.token}`
                }
            });
            if (res.ok) {
                alert('Content removed successfully');
                fetchPosts();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="animate-pulse text-gray-400 font-bold p-8 text-center uppercase tracking-widest">Scanning Platform Content...</div>;

    return (
        <div>
            <header className="mb-10">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Content Moderation</h1>
                <p className="text-gray-500 mt-2 font-medium">Monitor and manage user-generated posts.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {posts.map((post) => (
                    <div key={post._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
                        {post.mediaUrl && post.mediaType === 'image' && (
                            <div className="aspect-video relative overflow-hidden bg-gray-100">
                                <img
                                    src={post.mediaUrl}
                                    alt="Content"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        )}
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-xs text-uppercase">
                                    {post.user?.name?.[0] || 'U'}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-gray-900 text-sm truncate">{post.user?.name || 'Deleted User'}</p>
                                    <p className="text-[10px] text-gray-400 uppercase font-black">{new Date(post.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-6 line-clamp-4 italic">
                                "{post.content || 'No text content'}"
                            </p>
                            <div className="mt-auto pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => handleDelete(post._id)}
                                    className="w-full bg-red-50 text-red-600 font-black py-3 rounded-xl hover:bg-red-600 hover:text-white transition duration-300 text-xs uppercase tracking-widest"
                                >
                                    🗑️ Remove Post
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {posts.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-30">
                        <p className="text-6xl mb-4">📄</p>
                        <p className="font-bold uppercase tracking-widest">Platform is clean. No content found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
