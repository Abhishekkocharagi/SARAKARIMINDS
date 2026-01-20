'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

import Link from 'next/link';

interface Post {
    _id: string;
    content: string;
    user: {
        _id: string;
        name: string;
        accountType: string;
        exams: string[];
        profilePic: string;
    };
    tags: string[];
    reactions: {
        user: string;
        type: 'like' | 'celebrate' | 'support' | 'love' | 'insightful' | 'funny';
    }[];
    mediaUrl?: string;
    mediaType?: 'image' | 'pdf';
    comments: {
        user: {
            _id: string;
            name: string;
            profilePic: string;
        };
        text: string;
        createdAt: string;
    }[];
    createdAt: string;
}

export default function PostCard({ post }: { post: Post }) {
    const { user } = useAuth();
    const [reactions, setReactions] = useState(post.reactions || []);
    const [comments, setComments] = useState(post.comments || []);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showReactions, setShowReactions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const REACTION_TYPES = [
        { id: 'like', label: 'Like', icon: '👍', color: 'text-blue-600' },
        { id: 'celebrate', label: 'Celebrate', icon: '👏', color: 'text-green-600' },
        { id: 'support', label: 'Support', icon: '❤️', color: 'text-red-500' },
        { id: 'love', label: 'Love', icon: '💖', color: 'text-pink-500' },
        { id: 'insightful', label: 'Insightful', icon: '💡', color: 'text-yellow-500' },
        { id: 'funny', label: 'Funny', icon: '😆', color: 'text-orange-500' },
    ];

    const EMOJIS = ['🚀', '📚', '🎯', '🔥', '👏', '✅', '💡', '✍️', '💯', '🙏', '💪', '🎓'];

    const handleReaction = async (type: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/posts/${post._id}/like`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ type })
            });
            const data = await res.json();
            if (res.ok) {
                setReactions(data);
                setShowReactions(false);
            }
        } catch (err) { console.error(err); }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        try {
            const res = await fetch(`http://localhost:5000/api/posts/${post._id}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ text: commentText })
            });
            const data = await res.json();
            if (res.ok) {
                setComments(data);
                setCommentText('');
                setShowEmojiPicker(false);
            }
        } catch (err) { console.error(err); }
    };

    const myReaction = reactions.find(r => r.user === user?._id);
    const activeReaction = REACTION_TYPES.find(r => r.id === myReaction?.type);

    return (
        <div className="bg-white border rounded-xl p-6 mb-4 shadow-sm hover:shadow-md transition relative">
            <div className="flex items-center space-x-3 mb-4">
                <Link href={`/profile/${post.user?._id}`} className="w-12 h-12 bg-blue-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-blue-800 uppercase overflow-hidden shrink-0 transition-transform hover:scale-105 active:scale-95">
                    {post.user?.profilePic ? <img src={post.user.profilePic} className="w-full h-full object-cover" /> : (post.user?.name ? post.user.name.charAt(0) : '?')}
                </Link>
                <div>
                    <h4 className="font-bold text-gray-900 flex items-center">
                        <Link href={`/profile/${post.user?._id}`} className="hover:text-blue-700 transition-colors">
                            {post.user?.name}
                        </Link>
                        <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">
                            {post.user?.accountType}
                        </span>
                    </h4>
                    <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            {post.content && (
                <p className="text-gray-800 leading-relaxed mb-4 whitespace-pre-wrap">
                    {post.content}
                </p>
            )}

            {post.tags && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                        <span key={tag} className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                            #{tag.replace(/\s+/g, '')}
                        </span>
                    ))}
                </div>
            )}

            {/* Media Rendering */}
            {post.mediaUrl && (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    {post.mediaType === 'image' ? (
                        <img
                            src={post.mediaUrl}
                            alt="Post Media"
                            className="w-full h-auto max-h-[500px] object-contain bg-gray-50"
                        />
                    ) : (
                        <div className="p-6 bg-blue-50 flex items-center justify-between group">
                            <div className="flex items-center space-x-4">
                                <div className="text-4xl">📄</div>
                                <div>
                                    <p className="text-sm font-black text-blue-900 uppercase tracking-tighter">Document Attachment</p>
                                    <p className="text-[10px] font-bold text-blue-600">Open to view or download</p>
                                </div>
                            </div>
                            <a
                                href={post.mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-md group-hover:scale-105"
                            >
                                View PDF
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Reaction Stats */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                    {reactions.length > 0 && (
                        <div className="flex -space-x-1">
                            {Array.from(new Set(reactions.map(r => r.type))).slice(0, 3).map(type => (
                                <span key={type} className="text-xs">{REACTION_TYPES.find(r => r.id === type)?.icon}</span>
                            ))}
                        </div>
                    )}
                    <span className="text-[10px] text-gray-500 font-bold ml-1">
                        {reactions.length > 0 ? `${reactions.length} reactions` : ''}
                    </span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{comments.length} comments</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t text-sm font-semibold text-gray-500 relative">
                <div
                    className="relative group flex-1 flex justify-center py-2 hover:bg-gray-50 rounded-lg"
                    onMouseEnter={() => setShowReactions(true)}
                    onMouseLeave={() => setShowReactions(false)}
                >
                    <button
                        onClick={() => handleReaction(activeReaction?.id || 'like')}
                        className={`flex items-center space-x-2 transition ${activeReaction ? activeReaction.color : 'hover:text-blue-700'}`}
                    >
                        <span>{activeReaction ? activeReaction.icon : '👍'}</span>
                        <span>{activeReaction ? activeReaction.label : 'Like'}</span>
                    </button>

                    {/* Reactions Hover Menu */}
                    {showReactions && (
                        <div className="absolute bottom-full mb-2 left-0 bg-white border shadow-2xl rounded-full px-4 py-2 flex space-x-4 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                            {REACTION_TYPES.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => handleReaction(r.id)}
                                    className="text-2xl transform hover:scale-150 transition-transform duration-200 hover:-translate-y-2 origin-bottom"
                                    title={r.label}
                                >
                                    {r.icon}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 flex justify-center py-2 hover:bg-gray-50 rounded-lg">
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center space-x-2 hover:text-blue-700"
                    >
                        <span>💬</span>
                        <span>Comment</span>
                    </button>
                </div>

                <div className="flex-1 flex justify-center py-2 hover:bg-gray-50 rounded-lg">
                    <button onClick={() => alert('Link copied to clipboard!')} className="flex items-center space-x-2 hover:text-blue-700">
                        <span>↗️</span>
                        <span>Share</span>
                    </button>
                </div>
            </div>

            {showComments && (
                <div className="mt-4 space-y-4 border-t pt-4">
                    <div className="relative">
                        <form onSubmit={handleComment} className="flex space-x-2 relative">
                            <div className="relative flex-1">
                                <input
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Add a comment publicly..."
                                    className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg hover:grayscale-0 grayscale transition opacity-60 hover:opacity-100"
                                >
                                    😊
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={!commentText.trim()}
                                className="text-blue-700 font-black text-xs uppercase tracking-widest px-4 hover:text-blue-900 disabled:opacity-30 self-center"
                            >
                                Post
                            </button>
                        </form>

                        {/* Emoji Picker Dropdown */}
                        {showEmojiPicker && (
                            <div className="absolute bottom-full mb-2 right-0 bg-white border shadow-xl rounded-2xl p-3 grid grid-cols-4 gap-2 z-50 animate-in fade-in zoom-in duration-200">
                                {EMOJIS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => {
                                            setCommentText(prev => prev + emoji);
                                        }}
                                        className="text-xl hover:bg-gray-100 p-1 rounded transition"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar">
                        {comments.length > 0 ? (
                            comments.map((comment, idx) => (
                                <div key={idx} className="flex items-start space-x-3 group animate-in fade-in slide-in-from-top-1">
                                    <Link href={`/profile/${comment.user?._id}`} className="w-8 h-8 bg-blue-100 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black text-blue-800 shadow-sm uppercase overflow-hidden hover:scale-105 transition-transform">
                                        {comment.user?.profilePic ? <img src={comment.user.profilePic} className="w-full h-full object-cover" /> : (comment.user?.name ? comment.user.name.charAt(0) : '?')}
                                    </Link>
                                    <div className="bg-gray-50 rounded-2xl px-4 py-2 flex-1 border border-gray-100 group-hover:bg-gray-200/50 transition duration-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <Link href={`/profile/${comment.user?._id}`} className="text-[10px] font-black text-gray-900 uppercase tracking-tighter hover:text-blue-700 transition-colors">
                                                {comment.user?.name || 'Aspirant'}
                                            </Link>
                                            <p className="text-[9px] text-gray-400 font-bold">{new Date(comment.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <p className="text-xs text-gray-700 leading-relaxed font-bold">{comment.text}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-xs font-black text-gray-400 py-4 uppercase tracking-[0.2em] italic">No replies yet</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
