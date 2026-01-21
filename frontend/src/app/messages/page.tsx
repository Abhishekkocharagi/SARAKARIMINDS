'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import debounce from 'lodash.debounce';

interface MessageUser {
    _id: string;
    name: string;
    profilePic: string;
    accountType: string;
    isBot?: boolean;
    botType?: string;
}

interface Message {
    _id: string;
    sender: MessageUser | string;
    recipient: MessageUser | string;
    text: string;
    fileUrl?: string;
    fileType?: string;
    fileName?: string;
    createdAt: string;
    isRead: boolean;
    isDeletedForEveryone?: boolean;
}

interface Conversation {
    user: MessageUser;
    lastMessage: {
        text: string;
        createdAt: string;
        sender: string;
    };
    unreadCount: number;
    preferences: {
        isStarred: boolean;
        isMuted: boolean;
        isArchived: boolean;
        isFocused: boolean;
        label: string;
    };
}

function MessagesContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const preselectedUserId = searchParams.get('user');

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [bots, setBots] = useState<MessageUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<MessageUser | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [searchTab, setSearchTab] = useState<'focused' | 'other' | 'bots'>('focused');
    const [isNewChat, setIsNewChat] = useState(false);
    const [newChatQuery, setNewChatQuery] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<MessageUser[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeMsgMenu, setActiveMsgMenu] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const msgMenuRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) setShowOptions(false);
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) setShowEmojiPicker(false);
            if (msgMenuRef.current && !msgMenuRef.current.contains(event.target as Node)) setActiveMsgMenu(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchConversations = async () => {
        if (!user) return;
        try {
            const res = await fetch('http://localhost:5000/api/messages/conversations', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setConversations(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchBots = async () => {
        if (!user) return;
        try {
            const res = await fetch('http://localhost:5000/api/messages/bots', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setBots(data);
        } catch (err) { console.error(err); }
    };

    const fetchMessages = async (otherUserId: string) => {
        if (!user) return;
        setMessagesLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/messages/${otherUserId}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setMessages(data);
                fetchConversations();
                // Update navbar counts
                window.dispatchEvent(new Event('notificationsUpdated'));
            }
        } catch (err) { console.error(err); } finally { setMessagesLoading(false); }
    };

    const debouncedUserSearch = useRef(
        debounce(async (query: string) => {
            if (!query.trim()) {
                setUserSearchResults([]);
                return;
            }
            try {
                const res = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                const data = await res.json();
                setUserSearchResults(data);
            } catch (err) { console.error(err); }
        }, 300)
    ).current;

    useEffect(() => {
        if (isNewChat) debouncedUserSearch(newChatQuery);
    }, [newChatQuery, isNewChat]);

    useEffect(() => {
        if (user) {
            fetchConversations();
            fetchBots();
        }
    }, [user]);

    useEffect(() => {
        if (user && preselectedUserId && !loading) {
            const conv = conversations.find(c => c.user._id === preselectedUserId);
            if (conv) {
                if (selectedUser?._id !== conv.user._id) handleSelectUser(conv.user);
            } else if (!selectedUser || selectedUser._id !== preselectedUserId) {
                const bot = bots.find(b => b._id === preselectedUserId);
                if (bot) handleSelectUser(bot);
                else fetchUserDataAndStartChat(preselectedUserId);
            }
        }
    }, [user, preselectedUserId, loading, bots.length]);

    const fetchUserDataAndStartChat = async (id: string) => {
        if (!user) return;
        try {
            const res = await fetch(`http://localhost:5000/api/users/${id}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (data && data._id) {
                const newUser: MessageUser = {
                    _id: data._id,
                    name: data.name,
                    profilePic: data.profilePic,
                    accountType: data.accountType
                };
                setSelectedUser(newUser);
                fetchMessages(id);
            }
        } catch (err) { console.error(err); }
    };

    const handleUpdatePreference = async (targetId: string, updates: any) => {
        try {
            const res = await fetch(`http://localhost:5000/api/messages/preference/${targetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify(updates)
            });
            if (res.ok) fetchConversations();
            setShowOptions(false);
        } catch (err) { console.error(err); }
    };

    const handleDeleteConversation = async (targetId: string) => {
        if (!confirm('Delete this entire conversation?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/messages/conversation/${targetId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                setMessages([]);
                setSelectedUser(null);
                fetchConversations();
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteSingleMessage = async (messageId: string, mode: 'me' | 'everyone') => {
        try {
            const res = await fetch(`http://localhost:5000/api/messages/${messageId}/single?mode=${mode}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                if (mode === 'me') {
                    setMessages(messages.filter(m => m._id !== messageId));
                } else {
                    setMessages(messages.map(m => m._id === messageId ? { ...m, text: 'This message was deleted', isDeletedForEveryone: true, fileUrl: undefined } : m));
                }
                setActiveMsgMenu(null);
                fetchConversations();
            }
        } catch (err) { console.error(err); }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || !user) return;
        const text = newMessage;
        setNewMessage('');
        await sendRequest({ recipientId: selectedUser._id, text });
    };

    const sendRequest = async (payload: any, isFile = false) => {
        if (isFile) setUploading(true);
        const headers: any = { 'Authorization': `Bearer ${user?.token}` };
        if (!isFile) headers['Content-Type'] = 'application/json';

        try {
            const res = await fetch('http://localhost:5000/api/messages', {
                method: 'POST',
                headers,
                body: isFile ? payload : JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                setMessages(prev => [...prev, data]);
                fetchConversations();
            } else {
                alert(data.message || 'Failed to send message');
            }
        } catch (err) { console.error(err); alert('Network error while sending message'); } finally { if (isFile) setUploading(false); }
    };

    const handleSelectUser = (u: MessageUser) => {
        setSelectedUser(u);
        setIsNewChat(false);
        setNewChatQuery('');
        setUserSearchResults([]);
        fetchMessages(u._id);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && selectedUser && user) {
            const formData = new FormData();
            formData.append('recipientId', selectedUser._id);
            formData.append('file', file);
            formData.append('text', '');
            await sendRequest(formData, true);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const addEmoji = (emoji: string) => {
        setNewMessage(newMessage + emoji);
        setShowEmojiPicker(false);
    };

    const currentChatPreference = conversations.find(c => c.user._id === selectedUser?._id)?.preferences || {
        isStarred: false,
        isMuted: false,
        isArchived: false,
        isFocused: true,
        label: 'General'
    };

    const filteredConversations = conversations.filter(c => {
        const matchesSearch = c.user.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (searchTab === 'focused') return matchesSearch && !c.preferences.isArchived;
        if (searchTab === 'other') return matchesSearch && c.preferences.isArchived;
        return false;
    });

    const commonEmojis = ['😊', '😂', '👍', '🙏', '🔥', '📚', '🎯', '✅', '🚀', '⭐', '❤️', '💡', '🤔', '👋', '✍️'];

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-6 flex h-[calc(100vh-100px)] gap-6">
                <div className="w-full md:w-[380px] h-full bg-white border rounded-2xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-black text-blue-900 italic tracking-tighter">Messaging</h2>
                            <button onClick={() => setIsNewChat(true)} className={`p-2 rounded-full transition-all ${isNewChat ? 'bg-blue-700 text-white scale-110 rotate-12' : 'text-gray-400 hover:text-blue-700 hover:bg-blue-50'}`}>📝</button>
                        </div>
                        <div className="relative mb-4">
                            <input type="text" placeholder="Search messages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">🔍</span>
                        </div>
                        <div className="flex gap-2">
                            {['focused', 'other', 'bots'].map((t) => (
                                <button key={t} onClick={() => setSearchTab(t as any)} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${searchTab === t ? 'bg-blue-700 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {loading ? <div className="p-10 text-center animate-pulse text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Syncing...</div> :
                            searchTab === 'bots' ? bots.map(bot => (
                                <div key={bot._id} onClick={() => handleSelectUser(bot)} className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-blue-50 transition border-l-4 ${selectedUser?._id === bot._id ? 'border-blue-700 bg-blue-50/50' : 'border-transparent'}`}><div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100 bg-white flex items-center justify-center font-bold text-blue-700 shadow-sm text-xl">{bot.botType === 'assistant' ? '🤖' : bot.botType === 'exam' ? '📚' : '💼'}</div><div><h4 className="text-sm font-bold text-gray-900">{bot.name}</h4><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Official AI Bot</p></div></div>
                            )) : filteredConversations.length > 0 ? filteredConversations.map((conv) => (
                                <div key={conv.user._id} onClick={() => handleSelectUser(conv.user)} className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition border-l-4 ${selectedUser?._id === conv.user._id ? 'border-blue-700 bg-blue-50/30' : 'border-transparent'}`}>
                                    <div className="relative"><div className="w-12 h-12 rounded-full overflow-hidden border bg-blue-50 flex items-center justify-center font-bold text-blue-700">{conv.user.profilePic ? <img src={conv.user.profilePic} className="w-full h-full object-cover" /> : conv.user.name.charAt(0)}</div>{conv.preferences.isStarred && <div className="absolute -bottom-1 -right-1 text-xs">⭐</div>}{conv.unreadCount > 0 && <div className="absolute -top-1 -right-1 bg-blue-700 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{conv.unreadCount}</div>}</div>
                                    <div className="flex-1 min-w-0"><div className="flex justify-between items-start"><h4 className={`text-sm ${conv.unreadCount > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-800'} truncate`}>{conv.user.name}</h4><span className="text-[9px] font-bold text-gray-400">{formatDistanceToNow(new Date(conv.lastMessage.createdAt))}</span></div><p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{conv.lastMessage.sender === user?._id ? 'You: ' : ''}{conv.lastMessage.text}</p></div>
                                </div>
                            )) : <div className="p-10 text-center opacity-30 select-none"><div className="text-4xl mb-4">📭</div><p className="text-[10px] font-black uppercase tracking-widest">No messages here</p></div>}
                    </div>
                </div>
                <div className="flex-1 h-full bg-white border rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
                    {isNewChat ? (
                        <div className="flex flex-col h-full bg-gray-50/30"><div className="p-4 bg-white border-b flex items-center gap-4"><span className="text-xs font-black text-gray-400 uppercase tracking-widest">New message to</span><input autoFocus type="text" placeholder="Type a name..." value={newChatQuery} onChange={(e) => setNewChatQuery(e.target.value)} className="flex-1 border-none focus:ring-0 text-sm font-bold bg-gray-50 px-4 py-1.5 rounded-full" /><button onClick={() => setIsNewChat(false)} className="text-gray-400 hover:text-red-500 font-black text-xl">×</button></div><div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">{userSearchResults.length > 0 ? userSearchResults.map(u => (<div key={u._id} onClick={() => handleSelectUser(u)} className="flex items-center gap-3 p-3 bg-white border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-2xl cursor-pointer transition-all shadow-sm"><div className="w-10 h-10 rounded-full bg-blue-50 border overflow-hidden flex items-center justify-center font-bold text-blue-700 uppercase">{u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" /> : u.name.charAt(0)}</div><div><h4 className="text-sm font-bold text-gray-900">{u.name}</h4><p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{u.accountType} Aspirant</p></div></div>)) : <div className="text-center py-20 opacity-30 font-black uppercase text-[10px] tracking-widest">{newChatQuery.length > 0 ? `No users found for "${newChatQuery}"` : "Search for a fellow aspirant"}</div>}</div></div>
                    ) : selectedUser ? (
                        <>
                            <div className="p-4 border-b flex justify-between items-center bg-white z-20"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full overflow-hidden border bg-blue-50 flex items-center justify-center font-bold text-blue-700 shadow-sm relative text-xl">{selectedUser.profilePic ? <img src={selectedUser.profilePic} className="w-full h-full object-cover" /> : selectedUser.isBot ? (selectedUser.botType === 'assistant' ? '🤖' : selectedUser.botType === 'exam' ? '📚' : '💼') : selectedUser.name.charAt(0)}</div><div><h3 className="text-sm font-black text-gray-900 leading-tight">{selectedUser.name}</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{selectedUser.isBot ? 'Official Assistant' : `${selectedUser.accountType} Aspirant`}</p></div></div><div className="flex items-center gap-2 relative"><button onClick={() => handleUpdatePreference(selectedUser._id, { isStarred: !currentChatPreference.isStarred })} className={`p-2 rounded-full transition-all ${currentChatPreference.isStarred ? 'text-yellow-500 bg-yellow-50 scale-110' : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-50'}`}>{currentChatPreference.isStarred ? '★' : '☆'}</button><div className="relative" ref={optionsRef}><button onClick={() => setShowOptions(!showOptions)} className="p-2 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all text-xl font-bold">⋮</button>{showOptions && (<div className="absolute top-full right-0 mt-2 w-56 bg-white border rounded-2xl shadow-2xl py-2 z-50 overflow-hidden animate-in fade-in zoom-in duration-150 origin-top-right"><div className="px-4 py-2 border-b mb-1"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conversation Options</p></div><button onClick={() => handleUpdatePreference(selectedUser._id, { unread: true })} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition">Mark as unread</button><button onClick={() => handleUpdatePreference(selectedUser._id, { isStarred: !currentChatPreference.isStarred })} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition">{currentChatPreference.isStarred ? 'Unstar' : 'Star'}</button><button onClick={() => handleUpdatePreference(selectedUser._id, { isMuted: !currentChatPreference.isMuted })} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition">{currentChatPreference.isMuted ? 'Unmute' : 'Mute'}</button><button onClick={() => handleUpdatePreference(selectedUser._id, { isArchived: !currentChatPreference.isArchived })} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition">{currentChatPreference.isArchived ? 'Unarchive' : 'Archive'}</button>{!selectedUser.isBot && <button onClick={() => handleUpdatePreference(selectedUser._id, { isBlocked: true })} className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition border-t mt-1">Report / Block</button>}<button onClick={() => handleDeleteConversation(selectedUser._id)} className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition border-t mt-1">Delete conversation</button><Link href="/settings" className="block px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 transition border-t">Manage settings</Link></div>)}</div></div></div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 no-scrollbar relative">
                                {currentChatPreference.isMuted && <div className="absolute top-0 left-0 right-0 bg-orange-50 text-orange-700 p-2 text-center text-[10px] font-black uppercase tracking-widest z-10 border-b shadow-sm text-xs">Notifications Muted</div>}
                                {messagesLoading && messages.length === 0 ? <div className="h-full flex items-center justify-center animate-pulse text-[10px] font-black uppercase text-gray-300">Decrypting...</div> :
                                    messages.map((msg) => {
                                        const isMe = (typeof msg.sender === 'string' ? msg.sender : msg.sender._id) === user?._id;
                                        const isDeleted = msg.isDeletedForEveryone;
                                        return (
                                            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className="max-w-[75%] group relative">
                                                    {!isDeleted && (
                                                        <button
                                                            onClick={() => setActiveMsgMenu(msg._id)}
                                                            className={`absolute -top-2 ${isMe ? '-left-6' : '-right-6'} opacity-0 group-hover:opacity-100 transition-all p-1 text-gray-400 hover:text-blue-700 text-xs`}
                                                        >
                                                            ⋮
                                                        </button>
                                                    )}

                                                    {activeMsgMenu === msg._id && !isDeleted && (
                                                        <div ref={msgMenuRef} className={`absolute z-30 top-4 ${isMe ? 'right-0' : 'left-0'} bg-white border border shadow-xl rounded-xl py-1 w-40 overflow-hidden`}>
                                                            <button onClick={() => handleDeleteSingleMessage(msg._id, 'me')} className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition">Delete for me</button>
                                                            {isMe && <button onClick={() => handleDeleteSingleMessage(msg._id, 'everyone')} className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 transition">Delete for everyone</button>}
                                                        </div>
                                                    )}

                                                    <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${isDeleted ? 'bg-gray-100 text-gray-400 italic' : isMe ? 'bg-blue-700 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border'}`}>
                                                        {msg.text}
                                                        {msg.fileUrl && !isDeleted && (
                                                            <div className={`mt-2 p-3 rounded-xl border flex items-center gap-3 ${isMe ? 'bg-blue-800/50 border-blue-400 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                                                                <div className="text-2xl">{msg.fileType?.includes('image') ? '🖼️' : '📄'}</div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold truncate">{msg.fileName}</p>
                                                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`text-[10px] font-black uppercase tracking-wider underline ${isMe ? 'text-blue-100 hover:text-white' : 'text-blue-700 hover:text-black'}`}>Download File</a>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`text-[9px] mt-1 font-bold text-gray-400 ${isMe ? 'text-right' : 'text-left'}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {uploading && (<div className="flex justify-end"><div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-700 flex items-center gap-2">Uploading File... <div className="w-2 h-2 bg-blue-700 rounded-full animate-ping"></div></div></div>)}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 bg-white border-t relative">
                                {showEmojiPicker && (<div ref={emojiPickerRef} className="absolute bottom-full left-4 mb-4 bg-white border rounded-2xl shadow-2xl p-3 grid grid-cols-5 gap-2 animate-in slide-in-from-bottom-2 duration-200 z-50">{commonEmojis.map(emoji => (<button key={emoji} onClick={() => addEmoji(emoji)} className="text-xl hover:bg-blue-50 p-1.5 rounded-lg transition-all active:scale-90">{emoji}</button>))}</div>)}
                                <form onSubmit={handleSendMessage} className="bg-gray-100 rounded-2xl p-2 flex items-end gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all border border-transparent focus-within:border-blue-200 relative"><textarea rows={1} placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }} className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2 resize-none no-scrollbar font-medium" /><button type="submit" disabled={!newMessage.trim() || uploading} className="p-2.5 bg-blue-700 text-white rounded-xl hover:bg-black transition-all shadow-md active:scale-90 disabled:opacity-20"><span className="block transform -rotate-12">🚀</span></button></form>
                                <div className="flex gap-4 mt-2 px-2 text-gray-400 relative"><input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} /><button disabled={uploading} onClick={() => fileInputRef.current?.click()} className="hover:text-blue-700 transition p-1 hover:bg-blue-50 rounded-lg">🖼️</button><button disabled={uploading} onClick={() => fileInputRef.current?.click()} className="hover:text-blue-700 transition p-1 hover:bg-blue-50 rounded-lg">📎</button><button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`transition p-1 rounded-lg ${showEmojiPicker ? 'bg-blue-100 text-blue-700' : 'hover:text-blue-700 hover:bg-blue-50'}`}>😊</button><button onClick={() => alert('GIF Picker coming soon!')} className="hover:text-blue-700 transition p-1 hover:bg-blue-50 rounded-lg font-black text-[10px] tracking-tighter">GIF</button></div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50/30"><div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-6xl mb-8 shadow-xl border-4 border-blue-50 animate-bounce duration-[2000ms]">📬</div><h2 className="text-3xl font-black text-blue-900 tracking-tighter italic mb-4">Your Intelligent Inbox</h2><div className="h-1.5 w-24 bg-yellow-400 rounded-full mb-8 mx-auto shadow-sm"></div><p className="text-gray-400 text-sm max-w-sm mx-auto font-bold uppercase tracking-widest leading-loose">Start a conversation with bots or fellow aspirants. Use the <strong className="text-blue-700">Star</strong> to prioritize important discussions.</p><div className="mt-12 flex gap-4"><button onClick={() => setIsNewChat(true)} className="px-6 py-2.5 bg-blue-700 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition shadow-lg">New Message</button><button onClick={() => setSearchTab('bots')} className="px-6 py-2.5 bg-white border-2 border-blue-700 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition shadow-lg">Try Bot Assistant</button></div></div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function MessagesPage() {
    return (<Suspense fallback={<div className="min-h-screen bg-[#F3F2EF] pt-40 text-center"><div className="w-12 h-12 border-4 border-blue-700 border-t-white rounded-full animate-spin mx-auto mb-4"></div><p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em]">Initializing Core Messenger...</p></div>}><MessagesContent /></Suspense>);
}
