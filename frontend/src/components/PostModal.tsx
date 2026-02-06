'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { FiX } from 'react-icons/fi';
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
                    const res = await fetch(`http://localhost:5000/api/users/search?q=${mentionSearch}`, {
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
                setMediaPreview(null);
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
            formData.append('mentions', JSON.stringify(mentions));
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-black text-gray-900">Create Post</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <FiX size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex space-x-4 mb-4">
                        <div className="w-10 h-10 bg-blue-800 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-lg shadow-inner uppercase">
                            {user?.name.charAt(0)}
                        </div>
                        <div className="relative w-full">
                            <textarea
                                ref={textareaRef}
                                placeholder={t('post.box_placeholder')}
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 resize-none h-32 font-medium text-gray-700 transition-all"
                                value={content}
                                onChange={handleTextChange}
                                onKeyDown={handleKeyDown}
                            />
                            {showMentions && (
                                <div className="absolute top-full left-0 mt-1">
                                    <MentionDropdown
                                        users={matchingUsers}
                                        onSelect={handleSelectUser}
                                        selectedIndex={selectedIndex}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Media Preview */}
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
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t border-gray-100">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center space-x-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all group"
                        >
                            <span className="text-xl group-hover:scale-110 transition-transform">🖼️</span>
                            <span className="text-xs font-black text-gray-500 uppercase tracking-tighter">{t('post.media')}</span>
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
                            <span>{t('post.button')}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
