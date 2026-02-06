'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import debounce from 'lodash.debounce';
import { useLanguage } from '@/context/LanguageContext';

// --- INTERFACES ---
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
    post?: {
        _id: string;
        content: string;
        mediaUrl?: string;
        mediaType?: string;
        user?: {
            name: string;
            profilePic: string;
        };
    };
    createdAt: string;
    isRead: boolean;
    isDeletedForEveryone?: boolean;
}



interface Conversation {
    user: MessageUser;
    lastMessage: { text: string; createdAt: string; sender: string; };
    unreadCount: number;
    preferences: { isStarred: boolean; isMuted: boolean; isArchived: boolean; isFocused: boolean; label: string; };
}

interface Community {
    _id: string;
    name: string;
    description: string;
    price: number;
    isPaid: boolean;
    mentor: {
        _id: string;
        name: string;
        profilePic: string;
    };
    memberCount: number;
    maxMembers: number;
    groupIcon: string;
    paymentQrImage?: string; // Optional QR
    status: string;
    isMember?: boolean; // dynamic field from backend
}

// --- MAIN COMPONENT ---
function MessagesContent() {
    const { user, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedUserId = searchParams.get('user');

    // --- STATE: CHAT ---
    const [activeTab, setActiveTab] = useState<'chats' | 'communities'>('chats');
    const [conversations, setConversations] = useState<any[]>([]);
    const [bots, setBots] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [searchTab, setSearchTab] = useState<'focused' | 'other' | 'bots'>('focused');
    const [isNewChat, setIsNewChat] = useState(false);
    const [newChatQuery, setNewChatQuery] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeMsgMenu, setActiveMsgMenu] = useState<string | null>(null);

    // --- STATE: COMMUNITIES ---
    const [communities, setCommunities] = useState<{ my: Community[], paid: Community[], free: Community[] }>({ my: [], paid: [], free: [] });
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // --- REFS ---
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const msgMenuRef = useRef<HTMLDivElement>(null);

    // --- EFFECTS ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchConversations();
            fetchBots();
            fetchCommunities(); // Load communities too
        }
    }, [user, authLoading, router]);

    // --- API CALLS: CHAT ---
    const fetchConversations = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/messages/conversations', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setConversations(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchBots = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/messages/bots', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setBots(data);
        } catch (err) { console.error(err); }
    };

    const fetchMessages = async (otherUserId: string) => {
        setMessagesLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/messages/${otherUserId}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setMessages(data);
                fetchConversations();
            }
        } catch (err) { console.error(err); } finally { setMessagesLoading(false); }
    };

    const fetchUserDataAndStartChat = async (id: string) => {
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

    // --- API CALLS: COMMUNITIES ---
    const fetchCommunities = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/groups/explore', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCommunities({
                    my: data.myCommunities,
                    paid: data.paidCommunities,
                    free: data.freeCommunities
                });
            }
        } catch (err) { console.error(err); }
    };

    const handleJoinFree = async (group: Community) => {
        if (!confirm(`Join ${group.name} for free?`)) return;
        try {
            // Assuming existing join logic works for free
            const res = await fetch(`http://localhost:5000/api/groups/${group._id}/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                alert('Joined successfully!');
                fetchCommunities();
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (err) { console.error(err); }
    };

    const initPaidJoin = (group: Community) => {
        setSelectedCommunity(group);
        setShowPaymentModal(true);
    };

    const handleConfirmPayment = async () => {
        if (!selectedCommunity) return;
        try {
            const res = await fetch(`http://localhost:5000/api/groups/${selectedCommunity._id}/request-join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                alert('Payment confirmation sent! Mentor will approve shortly.');
                setShowPaymentModal(false);
                setSelectedCommunity(null);
                fetchCommunities();
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (err) { console.error(err); }
    };

    // --- HELPERS ---
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
        if (user && preselectedUserId && !loading && activeTab === 'chats') {
            const conv = conversations.find(c => c.user._id === preselectedUserId);
            if (conv) {
                if (selectedUser?._id !== conv.user._id) handleSelectUser(conv.user);
            } else if (!selectedUser || selectedUser._id !== preselectedUserId) {
                const bot = bots.find(b => b._id === preselectedUserId);
                if (bot) handleSelectUser(bot);
                else fetchUserDataAndStartChat(preselectedUserId);
            }
        }
    }, [user, preselectedUserId, loading, bots.length, activeTab]);


    const handleSelectUser = (u: MessageUser) => {
        setSelectedUser(u);
        setIsNewChat(false);
        setNewChatQuery('');
        setUserSearchResults([]);
        fetchMessages(u._id);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || !user) return;
        const text = newMessage;
        setNewMessage('');

        try {
            const res = await fetch('http://localhost:5000/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ recipientId: selectedUser._id, text })
            });
            const data = await res.json();
            if (res.ok) {
                setMessages(prev => [...prev, data]);
                fetchConversations();
            }
        } catch (err) { console.error(err); }
    };

    const filteredConversations = conversations.filter(c => {
        const matchesSearch = c.user.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (searchTab === 'focused') return matchesSearch && !c.preferences.isArchived;
        if (searchTab === 'other') return matchesSearch && c.preferences.isArchived;
        return false;
    });

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 pt-6 pb-6 flex min-h-[calc(100vh-88px)] gap-6">
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                {/* --- LEFT SIDEBAR (CHATS / COMMUNITIES TOGGLE) --- */}
                <div className="w-full md:w-[380px] h-full bg-white border rounded-2xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-black text-blue-900 italic tracking-tighter">{t('msg.title')}</h2>
                            {activeTab === 'chats' && (
                                <button onClick={() => setIsNewChat(true)} className="p-2 rounded-full text-gray-400 hover:text-blue-700 hover:bg-blue-50">📝</button>
                            )}
                        </div>

                        {/* Toggle Tabs */}
                        <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                            <button
                                onClick={() => setActiveTab('chats')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'chats' ? 'bg-white shadow-sm text-blue-900' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Direct Messages
                            </button>
                            <button
                                onClick={() => setActiveTab('communities')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'communities' ? 'bg-white shadow-sm text-blue-900' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Community
                            </button>
                        </div>

                        {activeTab === 'chats' && (
                            <>
                                <div className="relative mb-4">
                                    <input type="text" placeholder={t('msg.search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
                                    <span className="absolute right-3 top-2 text-gray-400 text-sm">🔍</span>
                                </div>
                                <div className="flex gap-2">
                                    {['focused', 'other', 'bots'].map((tab) => (
                                        <button key={tab} onClick={() => setSearchTab(tab as any)} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${searchTab === tab ? 'bg-blue-700 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                            {t(`msg.tabs.${tab}` as any)}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* List Content */}
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {activeTab === 'chats' ? (
                            loading ? <div className="p-10 text-center animate-pulse text-[10px] font-black text-gray-300 uppercase tracking-widest">Loading...</div> :
                                searchTab === 'bots' ? bots.map(bot => (
                                    <div key={bot._id} onClick={() => handleSelectUser(bot)} className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-blue-50 transition border-l-4 ${selectedUser?._id === bot._id ? 'border-blue-700 bg-blue-50/50' : 'border-transparent'}`}><div className="text-2xl w-10 h-10 flex items-center justify-center bg-blue-50 rounded-full">🤖</div><div><h4 className="text-sm font-bold text-gray-900">{bot.name}</h4><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Official Bot</p></div></div>
                                )) : filteredConversations.length > 0 ? filteredConversations.map((conv) => (
                                    <div key={conv.user._id} onClick={() => handleSelectUser(conv.user)} className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition border-l-4 ${selectedUser?._id === conv.user._id ? 'border-blue-700 bg-blue-50/30' : 'border-transparent'}`}>
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">{conv.user.profilePic ? <img src={conv.user.profilePic} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{conv.user.name[0]}</div>}</div>
                                        <div className="flex-1 min-w-0"><div className="flex justify-between items-start"><h4 className={`text-sm ${conv.unreadCount > 0 ? 'font-black' : 'font-bold'} truncate`}>{conv.user.name}</h4><span className="text-[9px] text-gray-400">{formatDistanceToNow(new Date(conv.lastMessage.createdAt))}</span></div><p className="text-xs text-gray-500 truncate">{conv.lastMessage.text}</p></div>
                                    </div>
                                )) : <div className="p-10 text-center opacity-30">No chats found</div>
                        ) : (
                            // COMMUNITY LIST (Unified)
                            <div className="p-4 space-y-6">
                                {/* My Joined Communities */}
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">My Joined Communities</h3>
                                    {communities.my.length > 0 ? (
                                        <div className="space-y-2">
                                            {communities.my.map(c => (
                                                <div key={c._id} className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center group cursor-pointer hover:shadow-md transition">
                                                    <div>
                                                        <h4 className="font-bold text-blue-900 text-sm">{c.name}</h4>
                                                        <p className="text-[10px] text-blue-500 font-bold uppercase">{c.memberCount} Members</p>
                                                    </div>
                                                    <span className="text-xl">➡️</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">You haven't joined any communities yet.</p>
                                    )}
                                </div>

                                {/* All Existing Communities */}
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Discover Communities</h3>
                                    <div className="space-y-3">
                                        {[...communities.paid, ...communities.free].length > 0 ? (
                                            [...communities.paid, ...communities.free].map(c => (
                                                <div key={c._id} className="p-4 bg-white border rounded-xl hover:border-blue-300 transition group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">{c.mentor?.profilePic && <img src={c.mentor.profilePic} />}</div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 text-sm">{c.name}</h4>
                                                                <p className="text-[10px] text-gray-500">by {c.mentor?.name}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`${c.price > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} font-black text-[10px] px-2 py-0.5 rounded uppercase`}>
                                                            {c.price > 0 ? `₹${c.price}` : 'Free'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>
                                                    <button
                                                        onClick={() => c.price > 0 ? initPaidJoin(c) : handleJoinFree(c)}
                                                        className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${c.price > 0 ? 'bg-black text-white hover:bg-gray-800' : 'border border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                                                    >
                                                        {c.price > 0 ? 'Check Details & Join' : 'Join Now'}
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">No more communities to discover.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RIGHT PANEL (CONTENT) --- */}
                <div className="flex-1 h-full bg-white border rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
                    {/* Render existing Chat UI here if activeTab === 'chats' */}
                    {activeTab === 'chats' ? (isNewChat ? (
                        <div className="flex flex-col h-full bg-gray-50/30"><div className="p-4 bg-white border-b flex items-center gap-4"><span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('msg.new_to')}</span><input autoFocus type="text" placeholder={t('msg.type_name')} value={newChatQuery} onChange={(e) => setNewChatQuery(e.target.value)} className="flex-1 border-none focus:ring-0 text-sm font-bold bg-gray-50 px-4 py-1.5 rounded-full" /><button onClick={() => setIsNewChat(false)} className="text-gray-400 hover:text-red-500 font-black text-xl">×</button></div><div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">{userSearchResults.length > 0 ? userSearchResults.map(u => (<div key={u._id} onClick={() => handleSelectUser(u)} className="flex items-center gap-3 p-3 bg-white border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-2xl cursor-pointer transition-all shadow-sm"><div className="w-10 h-10 rounded-full bg-blue-50 border overflow-hidden flex items-center justify-center font-bold text-blue-700 uppercase">{u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" /> : u.name.charAt(0)}</div><div><h4 className="text-sm font-bold text-gray-900">{u.name}</h4><p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{u.accountType === 'Aspirant' ? t('sidebar.aspirant') : u.accountType}</p></div></div>)) : <div className="text-center py-20 opacity-30 font-black uppercase text-[10px] tracking-widest">{newChatQuery.length > 0 ? `${t('msg.no_users')} "${newChatQuery}"` : t('msg.search_fellow')}</div>}</div></div>
                    ) : selectedUser ? (
                        /* CHAT WINDOW (Simplified copy) */
                        <>
                            <div className="p-4 border-b flex justify-between items-center bg-white z-20"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full overflow-hidden border bg-blue-50 flex items-center justify-center font-bold text-blue-700 shadow-sm relative text-xl">{selectedUser.profilePic ? <img src={selectedUser.profilePic} className="w-full h-full object-cover" /> : selectedUser.name.charAt(0)}</div><div><h3 className="text-sm font-black text-gray-900 leading-tight">{selectedUser.name}</h3></div></div></div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 no-scrollbar relative">
                                {messages.map((msg) => {
                                    const isMe = (typeof msg.sender === 'string' ? msg.sender : msg.sender._id) === user?._id;

                                    const handleDeleteMessage = async () => {
                                        if (!confirm('Are you sure you want to delete this message?')) return;
                                        try {
                                            const res = await fetch(`http://localhost:5000/api/messages/${msg._id}/single`, {
                                                method: 'DELETE',
                                                headers: { 'Authorization': `Bearer ${user?.token}` }
                                            });
                                            if (res.ok) {
                                                setMessages(prev => prev.filter(m => m._id !== msg._id));
                                                fetchConversations();
                                            }
                                        } catch (err) { console.error(err); }
                                    };

                                    return (
                                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                            <div className="flex flex-col max-w-[75%] gap-1 relative">
                                                {/* Delete button - only for sender */}
                                                {isMe && (
                                                    <button
                                                        onClick={handleDeleteMessage}
                                                        className="absolute -top-1 -right-1 bg-white border border-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 hover:border-red-300 z-10"
                                                        title="Delete message"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-gray-400 hover:text-red-500">
                                                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {msg.text && (
                                                    <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-blue-700 text-white rounded-br-none' : 'bg-white border rounded-bl-none'}`}>
                                                        {msg.text}
                                                    </div>
                                                )}
                                                {msg.post && (
                                                    <Link href={`/post/${msg.post._id}`} className={`block border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition w-full ${isMe ? 'ml-auto' : ''}`}>
                                                        {msg.post.mediaUrl && msg.post.mediaType === 'image' && (
                                                            <img src={msg.post.mediaUrl} className="w-full h-32 object-cover bg-gray-100" />
                                                        )}
                                                        <div className="p-3">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="w-4 h-4 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-[8px]">
                                                                    {msg.post.user?.profilePic ? <img src={msg.post.user.profilePic} className="w-full h-full object-cover" /> : msg.post.user?.name?.[0]}
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-900">{msg.post.user?.name}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 line-clamp-2">{msg.post.content}</p>
                                                        </div>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 bg-white border-t"><form onSubmit={handleSendMessage} className="flex gap-2"><input value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none" placeholder="Type a message..." /><button type="submit" className="bg-blue-700 text-white p-2 rounded-full">🚀</button></form></div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50/30"><div className="text-6xl mb-4">📬</div><h2 className="text-2xl font-black text-blue-900 italic">Messages</h2></div>
                    )) : (
                        /* COMMUNITY DASHBOARD PLACEHOLDER */
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50/30">
                            <div className="text-6xl mb-4">🏛️</div>
                            <h2 className="text-2xl font-black text-blue-900 italic mb-2">Community Hub</h2>
                            <p className="text-gray-500 text-sm max-w-sm">Select a community from the sidebar to start interacting, or discover new ones to join.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* PAID JOIN MODAL */}
            {showPaymentModal && selectedCommunity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">{selectedCommunity.name}</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">Premium Membership</p>

                        <div className="bg-gray-50 p-4 rounded-2xl mb-6">
                            <p className="text-sm font-medium text-gray-700 mb-4">{selectedCommunity.description}</p>
                            <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Price</span>
                                <span className="text-2xl font-black text-green-600">₹{selectedCommunity.price}/mo</span>
                            </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="text-center mb-8">
                            <p className="text-xs font-bold text-gray-500 mb-2">Scan to Pay</p>
                            <div className="w-48 h-48 bg-gray-200 mx-auto rounded-xl flex items-center justify-center overflow-hidden border-4 border-dashed border-gray-300">
                                {selectedCommunity.paymentQrImage ? (
                                    <img src={selectedCommunity.paymentQrImage} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-gray-400 font-bold">No QR Code<br />Contact Mentor</span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setShowPaymentModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-200">
                                Cancel
                            </button>
                            <button onClick={handleConfirmPayment} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-lg">
                                I Have Paid
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MessagesFallback() {
    return <div className="text-center pt-20">Loading...</div>;
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<MessagesFallback />}>
            <MessagesContent />
        </Suspense>
    );
}
