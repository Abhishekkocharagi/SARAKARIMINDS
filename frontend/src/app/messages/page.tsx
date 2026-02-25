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
import { API_BASE_URL } from '@/config';

// --- HELPERS ---
const renderTextWithLinks = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold hover:text-blue-200 break-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};

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
    isAdmin?: boolean;
    isOwner?: boolean;
    allowOnlyAdminsChat?: boolean;
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
    const [communities, setCommunities] = useState<{ my: Community[], paid: Community[], free: Community[], managed: Community[], pendingIds: string[] }>({ my: [], paid: [], free: [], managed: [], pendingIds: [] });
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
    const [newCommunityData, setNewCommunityData] = useState({
        name: '',
        description: '',
        price: 0,
        maxMembers: 100,
        examCategory: '',
        paymentType: 'monthly'
    });
    const [communityIconFile, setCommunityIconFile] = useState<File | null>(null);
    const [communityQrFile, setCommunityQrFile] = useState<File | null>(null);
    const [creatingCommunity, setCreatingCommunity] = useState(false);

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
            const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setConversations(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchBots = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/messages/bots`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setBots(data);
        } catch (err) { console.error(err); }
    };

    const fetchMessages = async (otherUserId: string) => {
        setMessagesLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/messages/${otherUserId}`, {
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
            const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
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
            const res = await fetch(`${API_BASE_URL}/api/groups/explore`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCommunities({
                    my: data.myCommunities,
                    paid: data.paidCommunities,
                    free: data.freeCommunities,
                    managed: data.managedCommunities || [],
                    pendingIds: data.pendingGroupIds || []
                });
            }
        } catch (err) { console.error(err); }
    };

    const handleJoinFree = async (group: Community) => {
        if (!confirm(`Join ${group.name} for free?`)) return;
        try {
            // Assuming existing join logic works for free
            const res = await fetch(`${API_BASE_URL}/api/groups/${group._id}/join`, {
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
            const res = await fetch(`${API_BASE_URL}/api/groups/${selectedCommunity._id}/request-join`, {
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

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('Delete this message for everyone?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/messages/${messageId}/single?mode=everyone`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                // Update local state
                setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeletedForEveryone: true, text: 'This message was deleted' } : m));
            }
        } catch (err) { console.error(err); }
    };

    const handleSelectCommunity = async (group: Community) => {
        setMessages([]); // Clear previous messages
        setMessagesLoading(true);
        setSelectedUser(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/groups/${group._id}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const fullDetails = await res.json();
                setSelectedCommunity(fullDetails);
                fetchCommunityPosts(group._id);
            }
        } catch (err) { console.error(err); }
    };

    const fetchCommunityPosts = async (groupId: string) => {
        setMessagesLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/posts`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Data is now from Message model (sender, text)
                const mappedMessages = data.map((msg: any) => ({
                    ...msg,
                    isCommunityPost: true
                }));
                setMessages(mappedMessages);
            } else {
                const err = await res.json();
                if (err.message.includes('authorized')) {
                    alert('You are not a member of this community yet.');
                    setSelectedCommunity(null);
                }
            }
        } catch (err) { console.error(err); } finally { setMessagesLoading(false); }
    };

    const handleSendCommunityMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedCommunity || !user) return;
        const text = newMessage;
        setNewMessage('');

        try {
            // Check if user is mentor/owner or if members are allowed (logic depends on backend)
            // For now, assume any member/owner can post (WhatsApp community style usually means restricted, but we'll see)
            const res = await fetch(`${API_BASE_URL}/api/groups/${selectedCommunity._id}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ content: text })
            });
            const data = await res.json();
            if (res.ok) {
                fetchCommunityPosts(selectedCommunity._id);
            } else {
                alert(data.message || 'Only mentors can post in this community');
            }
        } catch (err) { console.error(err); }
    };

    const handleCreateCommunity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setCreatingCommunity(true);
        try {
            const formData = new FormData();
            formData.append('name', newCommunityData.name);
            formData.append('description', newCommunityData.description);
            formData.append('price', newCommunityData.price.toString());
            formData.append('maxMembers', newCommunityData.maxMembers.toString());
            formData.append('examCategory', newCommunityData.examCategory);
            formData.append('paymentType', newCommunityData.paymentType);

            if (communityIconFile) formData.append('groupIcon', communityIconFile);
            if (communityQrFile) formData.append('paymentQrImage', communityQrFile);

            const res = await fetch(`${API_BASE_URL}/api/groups`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: formData
            });

            if (res.ok) {
                alert('Community created successfully!');
                setShowCreateCommunityModal(false);
                setNewCommunityData({ name: '', description: '', price: 0, maxMembers: 100, examCategory: '', paymentType: 'monthly' });
                setCommunityIconFile(null);
                setCommunityQrFile(null);
                fetchCommunities();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to create community');
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong');
        } finally {
            setCreatingCommunity(false);
        }
    };

    // --- HELPERS ---
    const debouncedUserSearch = useRef(
        debounce(async (query: string) => {
            if (!query.trim()) {
                setUserSearchResults([]);
                return;
            }
            try {
                const res = await fetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
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
        if (selectedCommunity) return handleSendCommunityMessage(e);
        if (!newMessage.trim() || !selectedUser || !user) return;
        const text = newMessage;
        setNewMessage('');

        try {
            const res = await fetch(`${API_BASE_URL}/api/messages`, {
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

    const filteredConversations = conversations.filter((c: Conversation) => {
        const matchesSearch = c.user.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (searchTab === 'focused') return matchesSearch && !c.preferences.isArchived;
        if (searchTab === 'other') return matchesSearch && c.preferences.isArchived;
        return false;
    });

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-6 flex flex-col md:flex-row min-h-[calc(100vh-88px)] gap-6 h-[calc(100vh-88px)] overflow-hidden">
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                {/* --- LEFT SIDEBAR (CHATS / COMMUNITIES TOGGLE) --- */}
                <div className={`
                    w-full md:w-[380px] h-full bg-white border rounded-2xl shadow-sm flex flex-col overflow-hidden
                    ${(selectedUser || selectedCommunity || isNewChat) ? 'hidden md:flex' : 'flex'}
                `}>
                    <div className="p-4 border-b">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-black text-blue-900 italic tracking-tighter">{t('msg.title')}</h2>
                            <div className="flex gap-2">
                                {activeTab === 'chats' ? (
                                    <button onClick={() => setIsNewChat(true)} className="p-2 rounded-full text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition-all" title="New Chat">📝</button>
                                ) : (
                                    (
                                        <button
                                            onClick={() => user?.isVerified ? setShowCreateCommunityModal(true) : alert('Your account is pending verification. Once verified, you can create communities.')}
                                            className="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-all font-black flex items-center justify-center bg-blue-50/50"
                                            title="Create Community"
                                        >
                                            <span className="text-lg">➕</span>
                                        </button>
                                    )
                                )}
                            </div>
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
                                )) : filteredConversations.length > 0 ? filteredConversations.map((conv: Conversation) => (
                                    <div key={conv.user._id} onClick={() => handleSelectUser(conv.user)} className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition border-l-4 ${selectedUser?._id === conv.user._id ? 'border-blue-700 bg-blue-50/30' : 'border-transparent'}`}>
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">{conv.user.profilePic ? <img src={conv.user.profilePic} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{conv.user.name[0]}</div>}</div>
                                        <div className="flex-1 min-w-0"><div className="flex justify-between items-start"><h4 className={`text-sm ${conv.unreadCount > 0 ? 'font-black' : 'font-bold'} truncate`}>{conv.user.name}</h4><span className="text-[9px] text-gray-400">{formatDistanceToNow(new Date(conv.lastMessage.createdAt))}</span></div><p className="text-xs text-gray-500 truncate">{conv.lastMessage.text}</p></div>
                                    </div>
                                )) : <div className="p-10 text-center opacity-30">No chats found</div>
                        ) : (
                            // COMMUNITY LIST (Unified)
                            <div className="p-4 space-y-6">
                                {/* Managed Communities (For mentors/admins) */}
                                {communities.managed.length > 0 && (
                                    <div>
                                        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <span>⭐</span> Communities I Manage
                                        </h3>
                                        <div className="space-y-2">
                                            {communities.managed.map((c: Community) => (
                                                <div key={c._id} onClick={() => handleSelectCommunity(c)} className={`p-3 bg-white border rounded-xl flex justify-between items-center group hover:shadow-md transition cursor-pointer border-l-4 ${selectedCommunity?._id === c._id ? 'border-blue-700 bg-blue-50/50' : 'border-blue-200'}`}>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 text-sm">{c.name}</h4>
                                                        <p className="text-[10px] text-blue-500 font-bold uppercase">{c.memberCount} Members • {c.status}</p>
                                                    </div>
                                                    <Link href={`/mentor/group/${c._id}`} onClick={(e) => e.stopPropagation()} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">
                                                        Manage
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* My Joined Communities */}
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">My Joined Communities</h3>
                                    {communities.my.length > 0 ? (
                                        <div className="space-y-2">
                                            {communities.my.map((c: Community) => (
                                                <div key={c._id} onClick={() => handleSelectCommunity(c)} className={`p-3 bg-blue-50 border rounded-xl flex justify-between items-center group cursor-pointer hover:shadow-md transition border-l-4 ${selectedCommunity?._id === c._id ? 'border-blue-700' : 'border-blue-100'}`}>
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
                                            [...communities.paid, ...communities.free].map((c: Community) => (
                                                <div key={c._id} className="p-4 bg-white border rounded-xl hover:border-blue-300 transition group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">{c.mentor?.profilePic ? <img src={c.mentor.profilePic} /> : <div className="w-full h-full flex items-center justify-center bg-gray-200 text-[10px]">{c.mentor?.name?.[0]}</div>}</div>
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
                                                        disabled={communities.pendingIds.includes(c._id)}
                                                        onClick={() => c.price > 0 ? initPaidJoin(c) : handleJoinFree(c)}
                                                        className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${communities.pendingIds.includes(c._id) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : c.price > 0 ? 'bg-black text-white hover:bg-gray-800' : 'border border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                                                    >
                                                        {communities.pendingIds.includes(c._id) ? 'Pending Approval' : c.price > 0 ? 'Check Details & Join' : 'Join Now'}
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
                <div className={`
                    flex-1 h-full bg-white border rounded-2xl shadow-sm flex flex-col overflow-hidden relative
                    ${(!selectedUser && !selectedCommunity && !isNewChat) ? 'hidden md:flex' : 'flex'}
                `}>
                    {/* Render existing Chat UI here if activeTab === 'chats' */}
                    {(selectedUser || selectedCommunity) ? (
                        /* CHAT WINDOW */
                        <>
                            <div className="p-4 border-b flex justify-between items-center bg-white z-20">
                                <div className="flex items-center gap-3">
                                    {/* Back Button (Mobile Only) */}
                                    <button
                                        onClick={() => { setSelectedUser(null); setSelectedCommunity(null); }}
                                        className="md:hidden p-2 -ml-2 text-gray-400 hover:text-blue-600"
                                    >
                                        <span className="text-xl">⬅️</span>
                                    </button>
                                    <div className="w-10 h-10 rounded-full overflow-hidden border bg-blue-50 flex items-center justify-center font-bold text-blue-700 shadow-sm relative text-xl">
                                        {selectedCommunity ? (
                                            selectedCommunity.groupIcon ? <img src={selectedCommunity.groupIcon} className="w-full h-full object-cover" /> : '🏛️'
                                        ) : (
                                            selectedUser.profilePic ? <img src={selectedUser.profilePic} className="w-full h-full object-cover" /> : selectedUser.name.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 leading-tight">{selectedCommunity ? selectedCommunity.name : selectedUser.name}</h3>
                                        {selectedCommunity && <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{selectedCommunity.memberCount} Members</p>}
                                    </div>
                                </div>
                                {selectedCommunity && (user?._id === selectedCommunity.mentor?._id || user?.role === 'admin') && (
                                    <Link href={`/mentor/group/${selectedCommunity._id}`} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition text-xs font-black uppercase tracking-widest">
                                        Manage
                                    </Link>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 no-scrollbar relative">
                                {messagesLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : messages.length > 0 ? messages.map((msg) => {
                                    const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
                                    const isMe = senderId === user?._id;
                                    const senderName = typeof msg.sender === 'object' ? msg.sender?.name : '';

                                    return (
                                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-2`}>
                                            <div className={`flex flex-col max-w-[75%] gap-0.5 relative`}>
                                                {!isMe && selectedCommunity && (
                                                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter ml-2 mb-0.5">{senderName}</span>
                                                )}

                                                <div className="flex items-center gap-2 group/msg">
                                                    {isMe && !msg.isDeletedForEveryone && (
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg._id)}
                                                            className="opacity-0 group-hover/msg:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all text-[10px]"
                                                            title="Delete for everyone"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}

                                                    <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${msg.isDeletedForEveryone
                                                        ? 'bg-gray-100 text-gray-400 italic border border-dashed'
                                                        : isMe
                                                            ? 'bg-blue-700 text-white rounded-br-none'
                                                            : 'bg-white border rounded-bl-none text-gray-800'
                                                        }`}>
                                                        {msg.isDeletedForEveryone ? 'This message was deleted' : renderTextWithLinks(msg.text)}

                                                        {msg.mediaUrl && !msg.isDeletedForEveryone && (
                                                            <div className="mt-2 rounded-lg overflow-hidden border">
                                                                <img src={msg.mediaUrl} className="max-w-full max-h-64 object-cover" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <span className={`text-[7px] font-bold text-gray-400 mt-1 uppercase tracking-widest ${isMe ? 'text-right' : 'text-left'}`}>
                                                    {formatDistanceToNow(new Date(msg.createdAt))} ago
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="flex flex-col items-center justify-center h-full opacity-30 text-center p-10">
                                        <div className="text-4xl mb-2">💬</div>
                                        <p className="text-sm font-black uppercase tracking-widest">No messages yet</p>
                                        <p className="text-xs">Start the conversation!</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 bg-white border-t">
                                {selectedCommunity && selectedCommunity.allowOnlyAdminsChat && !selectedCommunity.isOwner && !selectedCommunity.isAdmin ? (
                                    <div className="bg-gray-100 p-3 rounded-xl text-center">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Only admins can send messages to this community</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none" placeholder={selectedCommunity ? "Post an announcement..." : "Type a message..."} />
                                        <button type="submit" className="bg-blue-700 text-white p-2 rounded-full hover:bg-black transition-all">🚀</button>
                                    </form>
                                )}
                            </div>
                        </>
                    ) : isNewChat ? (
                        <div className="flex flex-col h-full bg-gray-50/30">
                            <div className="p-4 bg-white border-b flex items-center gap-4">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('msg.new_to')}</span>
                                <input autoFocus type="text" placeholder={t('msg.type_name')} value={newChatQuery} onChange={(e) => setNewChatQuery(e.target.value)} className="flex-1 border-none focus:ring-0 text-sm font-bold bg-gray-50 px-4 py-1.5 rounded-full" />
                                <button onClick={() => setIsNewChat(false)} className="text-gray-400 hover:text-red-500 font-black text-xl">×</button>
                            </div>
                            {/* ... Search results scroll ... */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                                {userSearchResults.length > 0 ? userSearchResults.map(u => (
                                    <div key={u._id} onClick={() => handleSelectUser(u)} className="flex items-center gap-3 p-3 bg-white border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-2xl cursor-pointer transition-all shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 border overflow-hidden flex items-center justify-center font-bold text-blue-700 uppercase">{u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" /> : u.name.charAt(0)}</div>
                                        <div><h4 className="text-sm font-bold text-gray-900">{u.name}</h4><p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{u.accountType === 'Aspirant' ? t('sidebar.aspirant') : u.accountType}</p></div>
                                    </div>
                                )) : <div className="text-center py-20 opacity-30 font-black uppercase text-[10px] tracking-widest">{newChatQuery.length > 0 ? `${t('msg.no_users')} "${newChatQuery}"` : t('msg.search_fellow')}</div>}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50/30">
                            <div className="text-6xl mb-4">📬</div>
                            <h2 className="text-2xl font-black text-blue-900 italic">Messages</h2>
                            <p className="text-gray-500 text-sm max-w-sm mt-2">Select a chat or community to start messaging.</p>
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
            {/* CREATE COMMUNITY MODAL */}
            {showCreateCommunityModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden relative border border-white/20">
                        {/* Decorative Header */}
                        <div className="h-32 bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 p-8 flex flex-col justify-end relative">
                            <div className="absolute top-4 right-6">
                                <button onClick={() => setShowCreateCommunityModal(false)} className="text-white/60 hover:text-white transition-colors text-2xl font-light">✕</button>
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-1">Create Community</h2>
                            <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Launch your professional learning circle</p>
                        </div>

                        <form onSubmit={handleCreateCommunity} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-4 md:col-span-2">
                                    <div className="flex items-center gap-6 mb-2">
                                        <div className="relative group">
                                            <div className="w-20 h-20 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-400 group-hover:bg-blue-50">
                                                {communityIconFile ? (
                                                    <img src={URL.createObjectURL(communityIconFile)} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-2xl group-hover:scale-110 transition-transform">🖼️</span>
                                                )}
                                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setCommunityIconFile(e.target.files?.[0] || null)} />
                                            </div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mt-2">Group Icon</p>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Community Name</label>
                                                <input required type="text" placeholder="e.g. KAS Toppers 2024" value={newCommunityData.name} onChange={e => setNewCommunityData({ ...newCommunityData, name: e.target.value })} className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-3.5 text-sm font-bold outline-none transition-all shadow-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Description</label>
                                        <textarea required rows={3} placeholder="What will members learn here?" value={newCommunityData.description} onChange={e => setNewCommunityData({ ...newCommunityData, description: e.target.value })} className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-sm font-medium outline-none transition-all shadow-sm resize-none" />
                                    </div>
                                </div>

                                {/* Configuration */}
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Exam Category</label>
                                    <select required value={newCommunityData.examCategory} onChange={e => setNewCommunityData({ ...newCommunityData, examCategory: e.target.value })} className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-3.5 text-sm font-bold outline-none transition-all shadow-sm appearance-none cursor-pointer">
                                        <option value="">Select Category</option>
                                        <option value="KAS">KAS</option>
                                        <option value="FDA">FDA</option>
                                        <option value="SDA">SDA</option>
                                        <option value="PSI">PSI</option>
                                        <option value="PDO">PDO</option>
                                        <option value="General Coding">General Coding</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Max Members</label>
                                    <input type="number" value={newCommunityData.maxMembers} onChange={e => setNewCommunityData({ ...newCommunityData, maxMembers: Number(e.target.value) })} className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-3.5 text-sm font-bold outline-none transition-all shadow-sm" />
                                </div>

                                {/* Pricing */}
                                <div className="md:col-span-2 bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex flex-col md:flex-row gap-6 mt-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-1.5 ml-1">Monthly Fee (₹)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-black">₹</span>
                                            <input type="number" value={newCommunityData.price} onChange={e => setNewCommunityData({ ...newCommunityData, price: Number(e.target.value) })} className="w-full bg-white border-2 border-transparent focus:border-blue-600 rounded-2xl p-3.5 pl-8 text-xl font-black text-blue-900 outline-none transition-all shadow-sm" />
                                        </div>
                                        <p className="text-[9px] font-bold text-blue-400 uppercase mt-2 ml-1">Set to 0 for Free communities</p>
                                    </div>

                                    {newCommunityData.price > 0 && (
                                        <div className="w-full md:w-48">
                                            <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-1.5 ml-1">Payment QR</label>
                                            <div className="relative group">
                                                <div className="h-[92px] bg-white border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                                                    {communityQrFile ? (
                                                        <img src={URL.createObjectURL(communityQrFile)} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="text-center">
                                                            <span className="text-xl">💳</span>
                                                            <p className="text-[8px] font-black text-blue-400 uppercase mt-1">Upload QR</p>
                                                        </div>
                                                    )}
                                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setCommunityQrFile(e.target.files?.[0] || null)} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={creatingCommunity}
                                    className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3 ${creatingCommunity ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-blue-700 hover:-translate-y-1 hover:shadow-blue-200 active:translate-y-0'}`}
                                >
                                    {creatingCommunity ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <span>🚀</span>
                                            Launch Community
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
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
