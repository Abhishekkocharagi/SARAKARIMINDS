'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function PostBox({ refreshPosts }: { refreshPosts: () => void }) {
    const [content, setContent] = useState('');
    const [media, setMedia] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('File is too large! Maximum size is 10MB.');
                return;
            }
            setMedia(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setMediaPreview(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                setMediaPreview(null); // Clear image preview for PDFs
            }
        }
    };

    const removeMedia = () => {
        setMedia(null);
        setMediaPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!content.trim() && !media) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('tags', JSON.stringify(user?.exams || []));
            if (media) {
                formData.append('media', media);
            }

            const res = await fetch('http://localhost:5000/api/posts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                },
                body: formData
            });
            if (res.ok) {
                setContent('');
                removeMedia();
                refreshPosts();
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to create post');
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border rounded-2xl p-5 mb-6 shadow-sm border-gray-100">
            <div className="flex space-x-4">
                <div className="w-12 h-12 bg-blue-800 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-xl shadow-inner uppercase">
                    {user?.name.charAt(0)}
                </div>
                <textarea
                    placeholder="What's your strategy for the upcoming exam?"
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 resize-none h-28 font-medium text-gray-700 transition-all"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>

            {/* Media Preview Section */}
            {media && (
                <div className="mt-4 relative group">
                    <div className="bg-gray-50 rounded-2xl p-4 border-2 border-dashed border-gray-200">
                        {mediaPreview ? (
                            <img src={mediaPreview} alt="Preview" className="max-h-64 rounded-xl mx-auto object-contain" />
                        ) : (
                            <div className="flex items-center space-x-3 text-blue-700 font-bold p-2">
                                <span className="text-2xl">📄</span>
                                <span className="text-sm truncate">{media.name}</span>
                                <span className="text-[10px] bg-blue-100 px-2 py-1 rounded-full">PDF</span>
                            </div>
                        )}
                        <button
                            onClick={removeMedia}
                            className="absolute top-2 right-2 bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black transition-all"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mt-5 border-t border-gray-50 pt-4">
                <div className="flex space-x-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all group"
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform">🖼️</span>
                        <span className="text-xs font-black text-gray-500 uppercase tracking-tighter">Media</span>
                    </button>
                    <input
                        type="file"
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                    />
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading || (!content.trim() && !media)}
                    className="bg-blue-700 text-white px-8 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-20 flex items-center space-x-2"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin text-lg">⏳</span>
                            <span>Posting...</span>
                        </>
                    ) : (
                        <span>Post Now</span>
                    )}
                </button>
            </div>
        </div>
    );
}
