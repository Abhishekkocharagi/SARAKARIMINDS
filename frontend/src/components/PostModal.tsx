'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { FiX } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';
import MentionDropdown from './MentionDropdown';

interface SearchUser {
    _id: string;
    name: string;
    profilePic: string;
}

export default function PostModal({ isOpen, onClose, refreshPosts }: { isOpen: boolean, onClose: () => void, refreshPosts: () => void }) {
    const [content, setContent] = useState('');
    const [media, setMedia] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Mention State
    const [showMentions, setShowMentions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [matchingUsers, setMatchingUsers] = useState<SearchUser[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionRange, setMentionRange] = useState({ start: 0, end: 0 });
    const [mentions, setMentions] = useState<string[]>([]); // Array of user IDs

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { user } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        if (mentionSearch.length >= 2) {
            const fetchUsers = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/api/users/search?q=${mentionSearch}`, {
                        headers: { 'Authorization': `Bearer ${user?.token}` }
                    });
                    const data = await res.json();
                    setMatchingUsers(data);
                    setSelectedIndex(0);
                } catch {
                    console.error('Mention search error');
                }
            };
            fetchUsers();
        } else {
            setMatchingUsers([]);
        }
    }, [mentionSearch, user?.token]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart;
        setContent(value);

        // Detect @ mention
        const textBeforeCursor = value.substring(0, cursorPosition);
        const atIndex = textBeforeCursor.lastIndexOf('@');

        if (atIndex !== -1 && !textBeforeCursor.substring(atIndex).includes(' ')) {
            const searchPart = textBeforeCursor.substring(atIndex + 1);
            setShowMentions(true);
            setMentionSearch(searchPart);
            setMentionRange({ start: atIndex, end: cursorPosition });
        } else {
            setShowMentions(false);
            setMentionSearch('');
        }
    };

    const handleSelectUser = (selectedUser: SearchUser) => {
        const before = content.substring(0, mentionRange.start);
        const after = content.substring(mentionRange.end);
        const newContent = `${before}@${selectedUser.name} ${after}`;

        setContent(newContent);
        setMentions([...mentions, selectedUser._id]);
        setShowMentions(false);
        setMentionSearch('');

        // Refocus textarea
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions && matchingUsers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % matchingUsers.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + matchingUsers.length) % matchingUsers.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelectUser(matchingUsers[selectedIndex]);
            } else if (e.key === 'Escape') {
                setShowMentions(false);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                alert('File is too large! Maximum size is 50MB.');
                return;
            }
            setMedia(file);
            const url = URL.createObjectURL(file);
            setMediaPreview(url);
        }
    };

    const removeMedia = () => {
        if (mediaPreview) URL.revokeObjectURL(mediaPreview);
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
            formData.append('mentions', JSON.stringify(mentions));
            if (media) {
                formData.append('media', media);
            }

            const res = await fetch(`${API_BASE_URL}/api/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                },
                body: formData
            });
            if (res.ok) {
                setContent('');
                setMentions([]);
                removeMedia();
                refreshPosts();
                onClose();
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to create post');
            }
        } catch {
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Create Post</h2>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-0.5">Share your insights</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all hover:rotate-90 text-gray-400 hover:text-gray-900"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex space-x-4">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg uppercase transform hover:scale-105 transition-transform">
                                {user?.name.charAt(0)}
                            </div>
                        </div>
                        <div className="relative w-full">
                            <textarea
                                ref={textareaRef}
                                placeholder={t('post.box_placeholder')}
                                className="w-full bg-transparent border-none rounded-2xl px-0 py-2 focus:ring-0 resize-none h-40 font-medium text-gray-800 text-lg placeholder-gray-300 transition-all leading-relaxed"
                                value={content}
                                onChange={handleTextChange}
                                onKeyDown={handleKeyDown}
                            />
                            {showMentions && (
                                <div className="absolute top-full left-0 z-10 w-full">
                                    <MentionDropdown
                                        users={matchingUsers}
                                        onSelect={handleSelectUser}
                                        selectedIndex={selectedIndex}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Media Preview Area */}
                    {media && (
                        <div className="relative group animate-in slide-in-from-bottom-4 duration-500">
                            <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-2xl bg-gray-50 relative">
                                {media.type.startsWith('image/') ? (
                                    <img src={mediaPreview!} alt="Preview" className="w-full h-auto max-h-[400px] object-cover" />
                                ) : media.type.startsWith('video/') ? (
                                    <video src={mediaPreview!} controls className="w-full h-auto max-h-[400px] bg-black" />
                                ) : (
                                    <div className="p-8 flex flex-col items-center justify-center space-y-4 bg-gradient-to-br from-blue-50 to-white">
                                        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-4xl transform -rotate-6">
                                            📄
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black text-gray-900 truncate max-w-xs">{media.name}</p>
                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">PDF DOCUMENT</p>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={removeMedia}
                                    className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow-xl text-gray-900 w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all transform hover:scale-110 active:scale-90"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Tools */}
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center space-x-3 bg-white hover:bg-blue-50 px-5 py-3 rounded-2xl border border-gray-200 shadow-sm transition-all group active:scale-95"
                        >
                            <span className="text-2xl group-hover:rotate-12 transition-transform">🌅</span>
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.1em]">{t('post.media')}</span>
                        </button>
                        <button
                            onClick={() => {
                                if (fileInputRef.current) {
                                    fileInputRef.current.setAttribute('accept', 'video/*');
                                    fileInputRef.current.click();
                                }
                            }}
                            className="flex items-center space-x-3 bg-white hover:bg-blue-50 px-5 py-3 rounded-2xl border border-gray-200 shadow-sm transition-all group active:scale-95"
                        >
                            <span className="text-2xl group-hover:rotate-12 transition-transform">🎥</span>
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.1em]">Video</span>
                        </button>
                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            onChange={(e) => {
                                handleFileChange(e);
                                // Reset to default accept
                                e.target.setAttribute('accept', 'image/*,video/*,application/pdf');
                            }}
                            accept="image/*,video/*,application/pdf"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || (!content.trim() && !media)}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-blue-200 transition-all shadow-xl active:scale-95 disabled:opacity-30 flex items-center justify-center space-x-3"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Posting...</span>
                            </>
                        ) : (
                            <>
                                <span>{t('post.button')}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
