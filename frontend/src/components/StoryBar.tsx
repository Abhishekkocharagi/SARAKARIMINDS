'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import PostModal from './PostModal';
import MentionDropdown from './MentionDropdown';

interface Story {
    _id: string;
    user: {
        _id: string;
        name: string;
        profilePic: string;
    };
    content?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    mentions?: { _id: string; name: string }[];
    sharedPost?: {
        _id: string;
        content: string;
        mediaUrl?: string;
        mediaType?: 'image' | 'pdf';
        user: { name: string; profilePic: string; };
    };
    tags?: string[];
    reactions: { user: string; type: string }[];
    viewers: string[];
    createdAt: string;
}

interface StoryGroup {
    user: Story['user'];
    stories: Story[];
    hasUnviewed: boolean;
}

interface SearchUser {
    _id: string;
    name: string;
    profilePic: string;
    accountType?: string;
}

export default function StoryBar() {
    const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
    const [showAddStory, setShowAddStory] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    // Viewer State
    const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    // Upload State
    const [newStoryContent, setNewStoryContent] = useState('');
    const [media, setMedia] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mentions, setMentions] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [showViewersList, setShowViewersList] = useState(false);
    const [viewersList, setViewersList] = useState<any[]>([]);

    // Mention Feature State
    const [showMentions, setShowMentions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [matchingUsers, setMatchingUsers] = useState<SearchUser[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionRange, setMentionRange] = useState({ start: 0, end: 0 });

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);

    const fetchStories = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/stories', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });

            if (res.status === 401) {
                console.error('Authentication failed - logging out');
                logout();
                return;
            }

            const data: Story[] = await res.json();

            if (Array.isArray(data)) {
                const groups: Record<string, StoryGroup> = {};
                data.forEach(story => {
                    // Safety check: ensure story.user exists before accessing _id
                    if (!story.user || !story.user._id) return;

                    const uid = story.user._id;
                    if (!groups[uid]) {
                        groups[uid] = { user: story.user, stories: [], hasUnviewed: false };
                    }
                    groups[uid].stories.push(story);

                    // Safety check for viewers array
                    const viewers = story.viewers || [];
                    if (!viewers.includes(user?._id || '')) {
                        groups[uid].hasUnviewed = true;
                    }
                });
                setStoryGroups(Object.values(groups).sort((_a, _b) => (_b.hasUnviewed === _a.hasUnviewed) ? 0 : _b.hasUnviewed ? 1 : -1));
            }
        } catch (err) { console.error('Failed to fetch stories', err); }
    };

    useEffect(() => {
        if (user) fetchStories();
    }, [user]);

    // Media Preview
    useEffect(() => {
        if (media) {
            const url = URL.createObjectURL(media);
            setMediaPreview(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setMediaPreview(null);
        }
    }, [media]);

    // Mention Search
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
                } catch (err) {
                    console.error('Mention search error:', err);
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
        setNewStoryContent(value);

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
        const before = newStoryContent.substring(0, mentionRange.start);
        const after = newStoryContent.substring(mentionRange.end);
        const newText = `${before}@${selectedUser.name} ${after}`;

        setNewStoryContent(newText);
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

    // Mark as Viewed
    const markAsViewed = async (storyId: string) => {
        if (!user) return;
        try {
            await fetch(`http://localhost:5000/api/stories/${storyId}/view`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            // Update local state without refetching to avoid flicker
            setStoryGroups(prev => prev.map(g => ({
                ...g,
                stories: g.stories.map(s => s._id === storyId ? { ...s, viewers: [...(s.viewers || []), user._id] } : s)
            })));
        } catch (err) { console.error(err); }
    };

    // Viewer Logic
    useEffect(() => {
        if (activeGroupIndex === null) return;

        const group = storyGroups[activeGroupIndex];
        if (!group || !group.stories || !group.stories[currentStoryIndex]) return;

        const story = group.stories[currentStoryIndex];

        // Mark as viewed
        if (user && !story.viewers.includes(user._id)) {
            markAsViewed(story._id);
        }

        setProgress(0);
        if (progressInterval.current) clearInterval(progressInterval.current);

        const duration = story.mediaType === 'video' ? 10000 : 5000; // 10s video (mock), 5s image
        const step = 100;

        progressInterval.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 100;
                }
                return prev + (step / duration) * 100;
            });
        }, step);

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [activeGroupIndex, currentStoryIndex]);

    const handleNext = () => {
        if (activeGroupIndex === null) return;
        const group = storyGroups[activeGroupIndex];

        if (currentStoryIndex < group.stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
        } else if (activeGroupIndex < storyGroups.length - 1) {
            setActiveGroupIndex(prev => (prev !== null ? prev + 1 : null));
            setCurrentStoryIndex(0);
        } else {
            setActiveGroupIndex(null); // Close
        }
    };

    const handlePrev = () => {
        if (activeGroupIndex === null) return;

        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
        } else if (activeGroupIndex > 0) {
            setActiveGroupIndex(prev => (prev !== null ? prev - 1 : null));
            // Go to last story of previous group
            setCurrentStoryIndex(storyGroups[activeGroupIndex - 1].stories.length - 1);
        } else {
            setActiveGroupIndex(null);
        }
    };

    const openStory = (index: number) => {
        const group = storyGroups[index];
        if (!group || !group.stories || group.stories.length === 0) return;

        // Start from first unviewed, or 0
        const firstUnviewed = group.stories.findIndex(s => s.viewers && !s.viewers.includes(user?._id || ''));
        setCurrentStoryIndex(firstUnviewed !== -1 ? firstUnviewed : 0);
        setActiveGroupIndex(index);
    };

    const handleAddStory = async () => {
        if (!newStoryContent.trim() && !media) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('content', newStoryContent);
            formData.append('mentions', JSON.stringify(mentions));
            formData.append('tags', JSON.stringify(tags));
            if (media) formData.append('media', media);

            const res = await fetch('http://localhost:5000/api/stories', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user?.token}` },
                body: formData
            });

            if (res.status === 401) {
                console.error('Authentication failed - logging out');
                logout();
                return;
            }

            if (res.ok) {
                setNewStoryContent('');
                setMedia(null);
                setMentions([]);
                setTags([]);
                setShowAddStory(false);
                fetchStories();
            } else {
                const errorData = await res.json();
                alert(`Failed to upload story: ${errorData.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Story upload error:', err);
            alert('Failed to upload story. Please try again.');
        }
        finally { setLoading(false); }
    };

    const [replyText, setReplyText] = useState('');
    const handleReact = async (storyId: string, type: string) => {
        try {
            await fetch(`http://localhost:5000/api/stories/${storyId}/react`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify({ type })
            });
            // Optimistic update
            // (In real app, update state properly)
        } catch (err) { console.error(err); }
    };

    const handleReply = async (e: React.FormEvent, storyId: string) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        try {
            await fetch(`http://localhost:5000/api/stories/${storyId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify({ text: replyText })
            });
            setReplyText('');
            alert(t('story.reply_sent'));
        } catch (err) { console.error(err); }
    };

    const handleDeleteStory = async (storyId: string) => {
        // @ts-expect-error
        if (!confirm(t('story.confirm_delete') || 'Delete this story?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/stories/${storyId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                setActiveGroupIndex(null);
                fetchStories();
            }
        } catch (err) { console.error(err); }
    };

    const fetchStoryViewers = async (storyId: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/stories/${storyId}/viewers`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setViewersList(data);
                setShowViewersList(true);
            }
        } catch (err) {
            console.error('Failed to fetch story viewers:', err);
        }
    };

    const renderRichContent = (text: string, storyMentions?: { _id: string, name: string }[]) => {
        if (!text) return null;
        const parts = text.split(/(@[\w\s.-]+)/g);
        return parts.map((part, i) => {
            if (part?.startsWith('@')) {
                const nameInText = part.substring(1).trim();
                const mentionedUser = storyMentions?.find(m =>
                    m.name.toLowerCase().replace(/\s+/g, '') === nameInText.toLowerCase().replace(/\s+/g, '') ||
                    m.name.toLowerCase() === nameInText.toLowerCase()
                );

                if (mentionedUser) {
                    return (
                        <Link
                            key={i}
                            href={`/profile/${mentionedUser._id}`}
                            className="text-blue-400 font-bold hover:underline cursor-pointer transition-colors"
                            onClick={(e) => { e.stopPropagation(); setActiveGroupIndex(null); }}
                        >
                            {part}
                        </Link>
                    );
                }

                return <span key={i} className="text-blue-400 font-bold">{part}</span>;
            }
            return part;
        });
    };

    const activeStory = activeGroupIndex !== null ? storyGroups[activeGroupIndex].stories[currentStoryIndex] : null;

    return (
        <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2 px-1">
            {/* Add Post Button */}
            <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
                <div
                    onClick={() => setIsPostModalOpen(true)}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg hover:shadow-blue-600/50 hover:scale-110 transition-all duration-300 border-4 border-white"
                >
                    <span className="text-white text-3xl font-bold">+</span>
                </div>
                <span className="text-[10px] mt-1 font-black text-gray-800 uppercase tracking-tighter">Add Post</span>
            </div>

            {/* Your Story Section */}
            <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
                <div
                    onClick={() => {
                        const myGroupIndex = storyGroups.findIndex(g => g.user._id === user?._id);
                        if (myGroupIndex !== -1) {
                            openStory(myGroupIndex);
                        } else {
                            setShowAddStory(true);
                        }
                    }}
                    className={`w-16 h-16 rounded-full p-[2px] border-2 ${storyGroups.some(g => g.user._id === user?._id) ? 'border-blue-600' : 'border-dashed border-gray-300'} group-hover:border-blue-500 transition-colors`}
                >
                    <div className="w-full h-full bg-gray-50 rounded-full flex items-center justify-center relative border-2 border-white overflow-hidden text-blue-600">
                        {user?.profilePic && storyGroups.some(g => g.user._id === user?._id) ? (
                            <img src={user.profilePic} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-black">{storyGroups.some(g => g.user._id === user?._id) ? user?.name?.charAt(0) : '+'}</span>
                        )}
                        {/* Smaller plus icon if they already have a story */}
                        {storyGroups.some(g => g.user._id === user?._id) && (
                            <div
                                onClick={(e) => { e.stopPropagation(); setShowAddStory(true); }}
                                className="absolute bottom-0 right-0 w-5 h-5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                            >+</div>
                        )}
                    </div>
                </div>
                <span className="text-[10px] mt-1 font-black text-gray-400 uppercase tracking-tighter">{t('story.your_story')}</span>
            </div>

            {/* Other Users' Stories */}
            {storyGroups.filter(g => g.user._id !== user?._id).map((group) => {
                // Find actual index in the original array for openStory
                const originalIndex = storyGroups.findIndex(sg => sg.user._id === group.user._id);
                return (
                    <div
                        key={group.user._id}
                        onClick={() => openStory(originalIndex)}
                        className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                    >
                        <div className={`w-16 h-16 rounded-full p-[2px] border-[2.5px] ${group.hasUnviewed ? 'border-blue-600' : 'border-gray-300'}`}>
                            <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center font-black text-blue-800 border-2 border-white overflow-hidden uppercase transition-transform hover:scale-105">
                                {group.user.profilePic && group.user.profilePic.trim() ? (
                                    <img src={group.user.profilePic} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    group.user.name?.charAt(0) || '?'
                                )}
                            </div>
                        </div>
                        <span className={`text-[10px] mt-1 font-black truncate w-16 text-center uppercase tracking-tighter ${group.hasUnviewed ? 'text-gray-800' : 'text-gray-400'}`}>
                            {group.user.name?.split(' ')[0] || 'Aspirant'}
                        </span>
                    </div>
                );
            })}

            {/* Viewer Modal */}
            {activeStory && activeGroupIndex !== null && (
                <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center animate-in fade-in duration-200">
                    <button onClick={() => setActiveGroupIndex(null)} className="absolute top-4 right-4 text-white text-4xl z-[120]">✕</button>

                    {/* Navigation Areas */}
                    <div className="absolute inset-y-0 left-0 w-1/3 z-[110]" onClick={handlePrev}></div>
                    <div className="absolute inset-y-0 right-0 w-1/3 z-[110]" onClick={handleNext}></div>

                    <div className="relative w-full max-w-sm h-full md:h-[90vh] bg-gray-900 md:rounded-3xl overflow-hidden shadow-2xl flex flex-col">

                        {/* Progress Bars */}
                        <div className="flex space-x-1 p-2 pt-4 absolute top-0 left-0 right-0 z-50">
                            {storyGroups[activeGroupIndex].stories.map((s, idx) => (
                                <div key={s._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white transition-all duration-100 ease-linear"
                                        style={{ width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%' }}
                                    ></div>
                                </div>
                            ))}
                        </div>

                        {/* User Header */}
                        <div className="flex items-center space-x-3 p-4 pt-8 z-50">
                            {activeStory.user.profilePic && activeStory.user.profilePic.trim() ? (
                                <img src={activeStory.user.profilePic} className="w-8 h-8 rounded-full border border-white" />
                            ) : (
                                <div className="w-8 h-8 rounded-full border border-white bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-xs">
                                    {activeStory.user.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h4 className="text-white text-xs font-black uppercase tracking-widest">{activeStory.user.name}</h4>
                                <span className="text-white/60 text-[10px]">{new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            {/* Delete Option for Author */}
                            {user && activeStory.user._id === user._id && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteStory(activeStory._id);
                                    }}
                                    className="ml-auto text-white/50 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-white/10"
                                    title="Delete Story"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-black flex items-center justify-center relative">
                            {activeStory.mediaUrl ? (
                                activeStory.mediaType === 'video' ? (
                                    <video src={activeStory.mediaUrl} autoPlay className="w-full h-full object-cover" />
                                ) : (
                                    <img src={activeStory.mediaUrl} className="w-full h-full object-cover" />
                                )
                            ) : activeStory.sharedPost ? (
                                <div className="p-6 w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                                    <div className="bg-white rounded-2xl p-4 w-full shadow-2xl">
                                        <div className="flex items-center gap-3 mb-3">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {activeStory.sharedPost.user?.profilePic ? (
                                                <img src={activeStory.sharedPost.user.profilePic} className="w-10 h-10 rounded-full bg-gray-200" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {activeStory.sharedPost.user?.name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{activeStory.sharedPost.user?.name || 'Unknown User'}</p>
                                                <p className="text-xs text-gray-500">Original Post</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-800 mb-3 line-clamp-4">{activeStory.sharedPost.content}</p>
                                        {activeStory.sharedPost.mediaUrl && (
                                            <div className="rounded-xl overflow-hidden h-48 bg-gray-100">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={activeStory.sharedPost.mediaUrl} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <Link href={`/post/${activeStory.sharedPost._id}`} className="block mt-3 text-center text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline">
                                            View Full Post
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-gradient-to-br from-blue-900 to-black w-full h-full flex items-center justify-center">
                                    <p className="text-2xl font-black text-white italic">{renderRichContent(activeStory.content || '', activeStory.mentions)}</p>
                                </div>
                            )}

                            {/* Overlay Text */}
                            {activeStory.mediaUrl && activeStory.content && (
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-white text-center font-medium">{renderRichContent(activeStory.content || '', activeStory.mentions)}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 z-[120] pb-8">
                            <form onSubmit={(e) => handleReply(e, activeStory._id)} className="flex items-center space-x-4">
                                <input
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder={t('story.message')}
                                    className="flex-1 bg-transparent border border-white/50 rounded-full px-4 py-3 text-white text-sm outline-none focus:border-white placeholder-white/70"
                                />
                                {['❤️', '🔥'].map(emoji => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleReact(activeStory._id, emoji)}
                                        className="text-2xl hover:scale-125 transition"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </form>
                        </div>

                        {/* Viewers Trigger (Only for own story) */}
                        {user && activeStory.user._id === user._id && (
                            <div className="absolute bottom-20 left-0 right-0 flex justify-center z-[130]">
                                <button
                                    onClick={() => fetchStoryViewers(activeStory._id)}
                                    className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 transition hover:bg-black/80 group"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span className="text-white text-xs font-bold uppercase tracking-widest">
                                        {activeStory.viewers?.length || 0} {activeStory.viewers?.length === 1 ? 'Viewer' : 'Viewers'}
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* Viewers List Drawer */}
                        {showViewersList && (
                            <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl z-[200] animate-in slide-in-from-bottom duration-300 max-h-[70%] flex flex-col shadow-2xl">
                                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl">
                                    <h5 className="font-black text-xs uppercase tracking-widest text-gray-900">Viewers</h5>
                                    <button onClick={() => setShowViewersList(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    {viewersList.length > 0 ? (
                                        <div className="space-y-4">
                                            {viewersList.map((viewer) => (
                                                <div key={viewer._id} className="flex items-center gap-3 group">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 overflow-hidden border-2 border-white shadow-sm">
                                                        {viewer.profilePic ? (
                                                            <img src={viewer.profilePic} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-bold text-blue-600 text-sm">
                                                                {viewer.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{viewer.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Viewed</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-10 text-center text-gray-400">
                                            <p className="text-2xl mb-2">👀</p>
                                            <p className="text-xs font-bold uppercase tracking-widest">No viewers yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showAddStory && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 overflow-hidden animate-zoom-in">
                        <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-wider">{t('story.new_story')}</h3>

                        <div className="space-y-4">
                            {mediaPreview ? (
                                <div className="relative h-48 w-full rounded-xl overflow-hidden group bg-black">
                                    {media?.type.startsWith('video') ? (
                                        <video src={mediaPreview} className="w-full h-full object-cover opacity-80" />
                                    ) : (
                                        <img src={mediaPreview} className="w-full h-full object-cover opacity-80" />
                                    )}
                                    <button
                                        onClick={() => setMedia(null)}
                                        className="absolute top-2 right-2 bg-white/20 p-1.5 rounded-full text-white hover:bg-red-500 transition"
                                    >✕</button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-32 w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition text-gray-400 group"
                                >
                                    <span className="text-3xl mb-2 group-hover:scale-110 transition">📷</span>
                                    <span className="text-xs font-bold uppercase">{t('story.select_media')}</span>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" hidden accept="image/*,video/*" onChange={e => setMedia(e.target.files?.[0] || null)} />

                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={newStoryContent}
                                    onChange={handleTextChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={t('story.caption_placeholder')}
                                    className="w-full bg-gray-100 rounded-xl p-4 text-sm font-medium outline-none border-2 border-transparent focus:border-blue-500 transition resize-none h-24"
                                />
                                {showMentions && (
                                    <div className="absolute top-full left-0 z-[110] mt-1">
                                        <MentionDropdown
                                            users={matchingUsers}
                                            onSelect={handleSelectUser}
                                            selectedIndex={selectedIndex}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button onClick={() => setShowAddStory(false)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl text-xs uppercase tracking-widest">{t('common.cancel')}</button>
                                <button
                                    onClick={handleAddStory}
                                    disabled={loading || (!newStoryContent && !media)}
                                    className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition shadow-lg active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest"
                                >
                                    {loading ? t('story.posting') : t('post.share')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Post Modal */}
            <PostModal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                refreshPosts={() => {
                    if (typeof window !== 'undefined') {
                        window.location.reload();
                    }
                }}
            />
        </div>
    );
}
