'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
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
        role: string;
    };
    tags: string[];
    reactions: {
        user: string;
        type: 'like' | 'celebrate' | 'support' | 'love' | 'insightful' | 'funny';
    }[];
    mediaUrl?: string;
    mediaType?: 'image' | 'pdf';
    comments: {
        _id: string;
        user: {
            _id: string;
            name: string;
            profilePic: string;
        };
        text: string;
        createdAt: string;
    }[];
    createdAt: string;
    isRepost?: boolean;
    originalPost?: Post;
    postType?: string;
    mentions?: { _id: string, name: string }[];
}

interface SearchUser {
    _id: string;
    name: string;
    profilePic: string;
    accountType?: string;
}

export default function PostCard({ post, onDelete, showDelete = false }: { post: Post, onDelete?: (postId: string) => void, showDelete?: boolean }) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [reactions, setReactions] = useState(post.reactions || []);
    const [comments, setComments] = useState(post.comments || []);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showReactions, setShowReactions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [sendSearchQuery, setSendSearchQuery] = useState('');
    const [sendSearchResults, setSendSearchResults] = useState<SearchUser[]>([]);
    const [selectedRecipients, setSelectedRecipients] = useState<SearchUser[]>([]);
    const [isSending, setIsSending] = useState(false);
    const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [isSaved, setIsSaved] = useState(user?.savedPosts?.includes(post._id) || false);

    const REACTION_TYPES = [
        { id: 'like', label: t('reaction.like'), icon: '👍', color: 'text-blue-600' },
        { id: 'celebrate', label: t('reaction.celebrate'), icon: '👏', color: 'text-green-600' },
        { id: 'support', label: t('reaction.support'), icon: '❤️', color: 'text-red-500' },
        { id: 'love', label: t('reaction.love'), icon: '💖', color: 'text-pink-500' },
        { id: 'insightful', label: t('reaction.insightful'), icon: '💡', color: 'text-yellow-500' },
        { id: 'funny', label: t('reaction.funny'), icon: '😆', color: 'text-orange-500' },
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
        } catch { console.error('Reaction error'); }
    };

    const renderRichContent = (text: string, postMentions?: { _id: string, name: string }[]) => {
        if (!text) return null;
        // Split text by mentions (@name) but keep the delimiter
        const parts = text.split(/(@[\w\s.-]+)/g);

        return parts.map((part, i) => {
            if (part?.startsWith('@')) {
                const nameInText = part.substring(1).trim();
                // Find matching user in mentions array (case-insensitive and removing spaces for matching)
                const mentionedUser = postMentions?.find(m =>
                    m.name.toLowerCase().replace(/\s+/g, '') === nameInText.toLowerCase().replace(/\s+/g, '') ||
                    m.name.toLowerCase() === nameInText.toLowerCase()
                );

                if (mentionedUser) {
                    return (
                        <Link
                            key={i}
                            href={`/profile/${mentionedUser._id}`}
                            className="text-blue-600 font-bold hover:underline cursor-pointer transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </Link>
                    );
                }

                return (
                    <span key={i} className="text-blue-600 font-bold">
                        {part}
                    </span>
                );
            }
            return part;
        });
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
        } catch { console.error('Comment error'); }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm(t('post.confirm_delete_comment') || 'Are you sure you want to delete this comment?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/posts/${post._id}/comment/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch { console.error('Delete comment error'); }
    };

    const [myConnections, setMyConnections] = useState<SearchUser[]>([]);

    const fetchConnections = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/connections', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyConnections(Array.isArray(data) ? data : (data.connections || []));
            }
        } catch { console.error('Fetch connections error'); }
    };

    const handleSearchUsers = async (query: string) => {
        setSendSearchQuery(query);
        if (!query.trim()) {
            setSendSearchResults([]);
            return;
        }
        try {
            const res = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            setSendSearchResults(data);
        } catch { console.error('User search error'); }
    };

    const handleSendPost = async () => {
        if (selectedRecipients.length === 0) return;
        setIsSending(true);
        try {
            const promises = selectedRecipients.map(recipient =>
                fetch('http://localhost:5000/api/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user?.token}`
                    },
                    body: JSON.stringify({
                        recipientId: recipient._id,
                        text: `Check out this post by ${post.user?.name}`,
                        postId: post._id
                    })
                })
            );
            await Promise.all(promises);
            alert(t('post.sent_success') || 'Sent successfully!');
            setShowSendModal(false);
            setSelectedRecipients([]);
            setSendSearchQuery('');
        } catch { console.error('Send post error'); } finally { setIsSending(false); }
    };

    const toggleRecipient = (recipient: SearchUser) => {
        if (selectedRecipients.find(u => u._id === recipient._id)) {
            setSelectedRecipients(prev => prev.filter(u => u._id !== recipient._id));
        } else {
            if (selectedRecipients.length >= 10) {
                alert('You can select up to 10 connections.');
                return;
            }
            setSelectedRecipients(prev => [...prev, recipient]);
        }
    };

    const myReaction = reactions.find((r) => r.user === user?._id);
    const activeReaction = REACTION_TYPES.find(r => r.id === myReaction?.type);

    return (
        <div className="bg-white border border-gray-100/50 rounded-3xl p-6 mb-8 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 relative group/card">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <Link href={`/profile/${post.user?._id}`} className="relative shrink-0 transition-transform hover:scale-105">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-full border-[3px] border-white shadow-md flex items-center justify-center font-bold text-blue-800 text-lg overflow-hidden ring-1 ring-black/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {post.user?.profilePic ? <img src={post.user.profilePic} alt={post.user.name} className="w-full h-full object-cover" /> : (post.user?.name ? post.user.name.charAt(0) : '?')}
                    </div>
                    {['mentor', 'academy'].includes(post.user?.role || '') && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-white text-white shadow-sm" title="Verified">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                                <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.751zM8.802 8.002a.75.75 0 011.06 0l1.09 1.09 2.156-3.235a.75.75 0 111.248.832l-2.67 4.005a.75.75 0 01-1.124.085l-1.67-1.671a.75.75 0 010-1.06z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </Link>
                <div className="flex-1 pt-1 min-w-0">
                    <h4 className="flex items-center flex-wrap gap-2 text-base font-bold text-gray-900 leading-tight">
                        <Link href={`/profile/${post.user?._id}`} className="hover:text-blue-700 transition-colors truncate">
                            {post.user?.name}
                        </Link>
                        {post.postType === 'mentor_insight' && (
                            <span className="shrink-0 text-[10px] bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                                <span>💡</span> INSIGHT
                            </span>
                        )}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${post.user?.accountType === 'Aspirant' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                            {post.user?.accountType === 'Aspirant' ? t('sidebar.aspirant') : post.user?.accountType}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 font-medium">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {showDelete && user?._id === post.user?._id && (
                        <button
                            onClick={async () => {
                                if (!confirm(t('post.confirm_delete') || 'Are you sure you want to delete this post?')) return;
                                try {
                                    const res = await fetch(`http://localhost:5000/api/posts/${post._id}`, {
                                        method: 'DELETE',
                                        headers: { 'Authorization': `Bearer ${user?.token}` }
                                    });
                                    if (res.ok && onDelete) onDelete(post._id);
                                } catch { console.error('Delete post error'); }
                            }}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                            title={t('post.delete') || 'Delete'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={async () => {
                            try {
                                const res = await fetch(`http://localhost:5000/api/posts/${post._id}/save`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${user?.token}` }
                                });
                                if (res.ok) {
                                    const data = await res.json();
                                    setIsSaved(data.isSaved);
                                }
                            } catch { console.error('Save post error'); }
                        }}
                        className={`text-gray-300 hover:text-blue-600 transition-colors`}
                        title={isSaved ? "Unsave" : "Save"}
                    >
                        {isSaved ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-600">
                                <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {post.isRepost && post.originalPost && (
                <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{post.user?.name} reposted</span>
                </div>
            )}

            {post.content && (
                <div className="text-gray-800 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap">
                    {renderRichContent(post.content, post.mentions)}
                </div>
            )}

            {post.isRepost && post.originalPost && (
                <div className="border border-blue-50 bg-blue-50/20 rounded-2xl overflow-hidden mb-4 hover:border-blue-100 transition-colors">
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {post.originalPost.user?.profilePic ? (
                                <img src={post.originalPost.user.profilePic} className="w-8 h-8 rounded-full bg-gray-200 border border-white shadow-sm" alt={post.originalPost.user?.name} />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 border border-white shadow-sm flex items-center justify-center text-xs font-bold text-gray-500">
                                    {post.originalPost.user?.name?.charAt(0) || '?'}
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{post.originalPost.user?.name}</p>
                                <p className="text-[10px] text-gray-500">{new Date(post.originalPost.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">{renderRichContent(post.originalPost.content, post.originalPost.mentions)}</p>
                        {post.originalPost.mediaUrl && (
                            <div className="rounded-xl overflow-hidden border border-white shadow-sm bg-black">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={post.originalPost.mediaUrl} className="w-full h-auto max-h-60 object-contain opacity-95" alt="Repost Media" />
                            </div>
                        )}
                        {post.originalPost.mediaType === 'pdf' && (
                            <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center gap-3 mt-2">
                                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold text-gray-700">{t('post.doc_attachment')}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {!post.isRepost && (
                <>
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag: string) => (
                                <span key={tag} className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                    #{tag.replace(/\s+/g, '')}
                                </span>
                            ))}
                        </div>
                    )}

                    {post.mediaUrl && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                            {post.mediaType === 'image' ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
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
                                            <p className="text-sm font-black text-blue-900 uppercase tracking-tighter">{t('post.doc_attachment')}</p>
                                            <p className="text-[10px] font-bold text-blue-600">{t('post.doc_hint')}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={post.mediaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-md group-hover:scale-105"
                                    >
                                        {t('post.view_pdf')}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                    {reactions.length > 0 && (
                        <div className="flex -space-x-1">
                            {Array.from(new Set(reactions.map((r) => r.type))).slice(0, 3).map((type) => (
                                <span key={type} className="text-xs">{REACTION_TYPES.find(rt => rt.id === type)?.icon}</span>
                            ))}
                        </div>
                    )}
                    <span className="text-[10px] text-gray-500 font-bold ml-1">
                        {reactions.length > 0 ? `${reactions.length} ${t('post.reactions')}` : ''}
                    </span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{comments.length} {t('post.comments')}</span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4 relative">
                <div
                    className="relative sm:flex-1 group flex items-center justify-center sm:justify-start"
                    onMouseEnter={() => {
                        if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
                        setShowReactions(true);
                    }}
                    onMouseLeave={() => {
                        reactionTimeoutRef.current = setTimeout(() => setShowReactions(false), 300);
                    }}
                >
                    <button
                        onClick={() => handleReaction(activeReaction?.id || 'like')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:bg-gray-50 active:scale-95 ${activeReaction ? activeReaction.color + ' font-bold' : 'text-gray-500 hover:text-blue-600'}`}
                    >
                        <span className="text-xl transform transition-transform group-active:scale-125">{activeReaction ? activeReaction.icon : '👍'}</span>
                        <span className="text-sm font-medium hidden sm:inline">{activeReaction ? (activeReaction.id === 'like' ? 'Unlike' : activeReaction.label) : t('post.like')}</span>
                    </button>

                    {showReactions && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full px-2 py-1.5 flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 p-2">
                            {REACTION_TYPES.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => handleReaction(r.id)}
                                    className="p-2hover:scale-125 transition-transform duration-200 text-2xl hover:-translate-y-1 origin-bottom px-1"
                                    title={r.label}
                                >
                                    {r.icon}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="sm:flex-1 flex justify-center">
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:bg-gray-50 active:scale-95 text-gray-500 hover:text-blue-600 ${showComments ? 'text-blue-600 bg-blue-50' : ''}`}
                    >
                        <span className="text-xl">💬</span>
                        <span className="text-sm font-medium hidden sm:inline">{t('post.comment')}</span>
                    </button>
                </div>

                <div className="sm:flex-1 flex justify-end">
                    <button
                        onClick={() => setShowShareMenu(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:bg-gray-50 active:scale-95 text-gray-500 hover:text-blue-600"
                    >
                        <span className="text-xl">↗️</span>
                        <span className="text-sm font-medium hidden sm:inline">{t('post.share')}</span>
                    </button>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-6 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="mt-4 space-y-4 border-t pt-4">
                        <div className="relative">
                            <form onSubmit={handleComment} className="flex space-x-2 relative items-center">
                                <div className="relative flex-1">
                                    <input
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder={t('post.add_comment')}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all pr-12 placeholder-gray-400 font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform opacity-60 hover:opacity-100 cursor-pointer p-1"
                                    >
                                        😊
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!commentText.trim()}
                                    className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md active:scale-95 flex items-center justify-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                    </svg>
                                </button>
                            </form>

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

                        <div className="space-y-6 max-h-80 overflow-y-auto no-scrollbar scroll-smooth">
                            {comments.length > 0 ? (
                                comments.map((comment, idx) => (
                                    <div key={idx} className="flex items-start space-x-3 group/comment animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Link href={`/profile/${comment.user?._id}`} className="w-9 h-9 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-blue-800 shadow-sm uppercase overflow-hidden hover:scale-105 transition-transform border border-white">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {comment.user?.profilePic ? <img src={comment.user.profilePic} alt={comment.user.name || 'User'} className="w-full h-full object-cover" /> : (comment.user?.name ? comment.user.name.charAt(0) : '?')}
                                        </Link>
                                        <div className="bg-gray-50/80 rounded-[20px] px-5 py-3 flex-1 border border-gray-100/50 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all duration-200 relative">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <Link href={`/profile/${comment.user?._id}`} className="text-[11px] font-black text-gray-900 uppercase tracking-tighter hover:text-blue-700 transition-colors">
                                                    {comment.user?.name || 'Aspirant'}
                                                </Link>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[10px] text-gray-400 font-medium">{new Date(comment.createdAt).toLocaleDateString()}</p>
                                                    {(comment.user?._id === user?._id || post.user?._id === user?._id) && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment._id)}
                                                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/comment:opacity-100 p-1 -m-1"
                                                            title="Delete comment"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed font-medium">{comment.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-xs font-black text-gray-400 py-8 uppercase tracking-[0.25em] italic">{t('post.no_replies')}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showShareMenu && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
                        <button
                            onClick={() => setShowShareMenu(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-xl font-black text-gray-900 mb-6">Share Post</h3>

                        <div className="space-y-3">
                            <button
                                onClick={async () => {
                                    if (confirm('Repost this to your feed?')) {
                                        try {
                                            const res = await fetch('http://localhost:5000/api/posts', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${user?.token}`
                                                },
                                                body: JSON.stringify({ originalPostId: post.isRepost ? post.originalPost?._id : post._id })
                                            });
                                            if (res.ok) {
                                                alert('Reposted successfully!');
                                                setShowShareMenu(false);
                                                window.location.reload();
                                            }
                                        } catch { console.error('Repost error'); }
                                    }
                                }}
                                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition group text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Repost</h4>
                                    <p className="text-xs text-gray-500">Instantly share with your network</p>
                                </div>
                            </button>

                            <button
                                onClick={async () => {

                                    const confirmKey = 'story.confirm_add' as any;
                                    if (confirm(t(confirmKey) || 'Add this post to your story?')) {
                                        try {
                                            const formData = new FormData();
                                            formData.append('sharedPost', post._id);
                                            const res = await fetch('http://localhost:5000/api/stories', {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${user?.token}` },
                                                body: formData
                                            });
                                            if (res.ok) {

                                                const successKey = 'story.posted_success' as any;
                                                alert(t(successKey) || 'Added to story!');
                                                setShowShareMenu(false);
                                            }
                                        } catch { console.error('Story share error'); }
                                    }
                                }}
                                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition group text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 group-hover:bg-pink-200 transition">
                                    <span className="text-xl">◎</span>
                                </div>
                                <div>
                                    {(() => { const key = 'story.add_to_story' as any; return <h4 className="font-bold text-gray-900 text-sm">{t(key) || 'Add to Story'}</h4>; })()}
                                    <p className="text-xs text-gray-500">{'Share visible for 24h'}</p>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    const thoughts = prompt('Add your thoughts:');
                                    if (thoughts) {
                                        (async () => {
                                            try {
                                                const res = await fetch('http://localhost:5000/api/posts', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${user?.token}`
                                                    },
                                                    body: JSON.stringify({
                                                        originalPostId: post.isRepost ? post.originalPost?._id : post._id,
                                                        content: thoughts
                                                    })
                                                });
                                                if (res.ok) {
                                                    alert('Shared successfully!');
                                                    setShowShareMenu(false);
                                                    window.location.reload();
                                                }
                                            } catch { console.error('Share error'); }
                                        })();
                                    }
                                }}
                                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition group text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Share with thoughts</h4>
                                    <p className="text-xs text-gray-500">Create a new post with this attachment</p>
                                </div>
                            </button>

                            <div className="h-px bg-gray-100 my-2"></div>

                            <button
                                onClick={() => {
                                    setShowShareMenu(false);
                                    setShowSendModal(true);
                                    fetchConnections();
                                }}
                                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition group text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{t('post.send_message') || 'Send as Message'}</h4>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
                                    alert(t('post.link_copied'));
                                    setShowShareMenu(false);
                                }}
                                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition group text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{t('post.copy_link') || 'Copy Link'}</h4>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {
                showSendModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" style={{ zIndex: 9999 }}>
                        <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col max-h-[80vh]">
                            <button
                                onClick={() => setShowSendModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <h3 className="text-xl font-black text-gray-900 mb-1">{t('post.send_to') || 'Send to'}</h3>
                            <p className="text-xs text-gray-500 mb-4">{selectedRecipients.length}/10 selected</p>

                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder={t('post.search_user') || 'Search user...'}
                                    value={sendSearchQuery}
                                    onChange={(e) => handleSearchUsers(e.target.value)}
                                    className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                {sendSearchQuery.trim() === '' ? (
                                    <>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Connections</p>
                                        {myConnections.length > 0 ? (
                                            myConnections.map((connUser) => {
                                                const isSelected = selectedRecipients.some(u => u._id === connUser._id);
                                                return (
                                                    <button
                                                        key={connUser._id}
                                                        onClick={() => toggleRecipient(connUser)}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'} border`}
                                                    >
                                                        <div className="relative">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={connUser.profilePic || ''} className="w-10 h-10 rounded-full bg-gray-200 object-cover" alt={connUser.name} />
                                                            {isSelected && (
                                                                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 border-2 border-white">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <p className="font-bold text-gray-900 text-sm">{connUser.name}</p>
                                                            <p className="text-[10px] text-gray-500">{connUser.accountType}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <p className="text-center text-gray-400 text-sm py-8">No connections found</p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {sendSearchResults.length > 0 ? (
                                            sendSearchResults.map((searchUser) => {
                                                const isSelected = selectedRecipients.some(u => u._id === searchUser._id);
                                                return (
                                                    <button
                                                        key={searchUser._id}
                                                        onClick={() => toggleRecipient(searchUser)}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'} border`}
                                                    >
                                                        <div className="relative">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={searchUser.profilePic || ''} className="w-10 h-10 rounded-full bg-gray-200 object-cover" alt={searchUser.name} />
                                                            {isSelected && (
                                                                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 border-2 border-white">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <p className="font-bold text-gray-900 text-sm">{searchUser.name}</p>
                                                            <p className="text-[10px] text-gray-500">{searchUser.accountType}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <p className="text-center text-gray-400 text-sm py-8">No users found</p>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t">
                                <button
                                    onClick={handleSendPost}
                                    disabled={selectedRecipients.length === 0 || isSending}
                                    className="w-full bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Send to {selectedRecipients.length} people</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
