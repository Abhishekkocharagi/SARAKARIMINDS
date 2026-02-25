'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter, usePathname } from 'next/navigation';
import debounce from 'lodash.debounce';
import { API_BASE_URL } from '@/config';
import { FiMenu, FiSearch, FiSettings, FiHome, FiUsers, FiMessageCircle, FiBell, FiUser } from 'react-icons/fi';
import { useNavigation } from '@/context/NavigationContext';

interface SearchUser {
    _id: string;
    name: string;
    profilePic: string;
    accountType: string;
    about?: string;
}

export default function Navbar() {
    const { user } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const { toggleSidebar } = useNavigation();
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/feed') return pathname === '/feed' || pathname === '/';
        return pathname?.startsWith(path);
    };

    const getLinkStyles = (path: string) => `
        relative h-full flex flex-col items-center justify-center min-w-[80px] px-1 border-b-2 transition-all duration-200
        ${isActive(path)
            ? 'border-gray-900 text-gray-900 font-bold'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 font-medium'}
    `;

    // Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [recentSearches, setRecentSearches] = useState<SearchUser[]>([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Notification Counts
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [pendingConnections, setPendingConnections] = useState(0);
    const [hasNewPosts, setHasNewPosts] = useState(false);
    const [apiErrors, setApiErrors] = useState(0);

    // Refs for click outside
    const searchRef = useRef<HTMLDivElement>(null);

    // Fetch Recent Searches
    const fetchRecentSearches = async () => {
        if (!user?.token) return;
        const baseUrl = API_BASE_URL;
        try {
            const res = await fetch(`${baseUrl}/api/users/recent-search`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setRecentSearches(data);
                setApiErrors(0);
            }
        } catch (err) {
            setApiErrors(prev => prev + 1);
        }
    };

    // Fetch Notification Counts
    const fetchNotificationCounts = async () => {
        if (!user?.token) return;
        const baseUrl = API_BASE_URL;
        try {
            const res = await fetch(`${baseUrl}/api/notifications/unread-counts`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setUnreadNotifications(Number(data.notifications) || 0);
                    setUnreadMessages(Number(data.messages) || 0);
                    setPendingConnections(Number(data.connections) || 0);
                    setHasNewPosts(!!data.hasNewPosts);
                }
                setApiErrors(0);
            }
        } catch (err) {
            setApiErrors(prev => prev + 1);
        }
    };

    const markNetworkSeen = async () => {
        if (!user?.token) return;
        setPendingConnections(0);
        const baseUrl = API_BASE_URL;
        try {
            await fetch(`${baseUrl}/api/connections/mark-seen`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
        } catch (err) { console.debug('Navbar: Mark network seen failure'); }
    };

    const markMessagesRead = async () => {
        if (!user?.token) return;
        setUnreadMessages(0);
        const baseUrl = API_BASE_URL;
        try {
            await fetch(`${baseUrl}/api/messages/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
        } catch (err) { console.debug('Navbar: Mark messages read failure'); }
    };

    const markNotificationsRead = async () => {
        if (!user?.token) return;
        setUnreadNotifications(0);
        const baseUrl = API_BASE_URL;
        try {
            await fetch(`${baseUrl}/api/notifications/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
        } catch (err) { console.debug('Navbar: Mark notifications read failure'); }
    };

    const clearFeedDot = async () => {
        if (!user?.token) return;
        setHasNewPosts(false);
        const baseUrl = API_BASE_URL;
        try {
            await fetch(`${baseUrl}/api/posts/last-visit`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
        } catch (err) { console.debug('Navbar: Clear feed dot failure'); }
    };

    // Search Users (Debounced)
    const debouncedSearch = useRef(
        debounce(async (query: string) => {
            console.log('Frontend Search Triggered:', query);
            if (!query.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }
            if (!user?.token) return;
            const baseUrl = API_BASE_URL;
            try {
                const res = await fetch(`${baseUrl}/api/users/search?q=${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data);
                }
            } catch (err) { console.debug('Navbar: Search failure'); }
            finally { setIsSearching(false); }
        }, 300)
    ).current;

    // Effects
    useEffect(() => {
        if (user) {
            fetchRecentSearches();
            fetchNotificationCounts();

            // Poll for updates every 30 seconds, but only if API seems healthy
            const interval = setInterval(() => {
                if (apiErrors < 3) {
                    fetchNotificationCounts();
                } else if (apiErrors === 3) {
                    console.debug('Navbar: API appears to be down, throttling requests');
                }
            }, 30000);

            // Listen for manual updates
            const handleManualUpdate = () => fetchNotificationCounts();
            window.addEventListener('notificationsUpdated', handleManualUpdate);

            return () => {
                clearInterval(interval);
                window.removeEventListener('notificationsUpdated', handleManualUpdate);
            };
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        setIsSearching(true);
        debouncedSearch(query);
        setShowSearchDropdown(true);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/network?search=${encodeURIComponent(searchQuery)}`);
            setShowSearchDropdown(false);
        }
    };

    const handleResultClick = async (targetUser: SearchUser) => {
        router.push(`/profile/${targetUser._id}`);
        setShowSearchDropdown(false);

        if (!user?.token) return;
        const baseUrl = API_BASE_URL;
        try {
            const res = await fetch(`${baseUrl}/api/users/recent-search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ targetUserId: targetUser._id })
            });
            if (res.ok) fetchRecentSearches(); // Update local list
        } catch (err) { console.debug('Navbar: Save search failure'); }
    };

    const clearRecent = async () => {
        if (!user?.token) return;
        const baseUrl = API_BASE_URL;
        try {
            await fetch(`${baseUrl}/api/users/recent-search`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            setRecentSearches([]);
        } catch (err) { console.debug('Navbar: Clear searches failure'); }
    };

    return (
        <>
            {/* Top Navbar */}
            <nav className="sticky top-0 z-50 bg-white border-b h-14 md:h-16 shadow-sm">
                <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 md:px-6">
                    {/* Left: Hamburger (Mobile) / Logo + Search (Desktop) */}
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 md:hidden text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Toggle Sidebar"
                        >
                            <FiMenu size={22} />
                        </button>

                        <Link href="/feed" className="hidden md:block flex-shrink-0">
                            <img src="/logo_full.png" alt="SarkariMinds" className="h-8 w-auto object-contain" />
                        </Link>

                        {/* Global Search Bar (Desktop) */}
                        <div className="relative hidden md:block w-full max-w-[280px]" ref={searchRef}>
                            <form onSubmit={handleSearchSubmit}>
                                <input
                                    type="text"
                                    placeholder={t('nav.search')}
                                    value={searchQuery}
                                    onFocus={() => setShowSearchDropdown(true)}
                                    onChange={handleSearchChange}
                                    className="w-full pl-9 pr-4 py-1.5 bg-[#EEF3F7] border border-transparent rounded text-sm outline-none focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 transition-all font-medium"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔍</span>
                            </form>

                            {/* Search Dropdown - (Logic remains same) */}
                            {showSearchDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-[400px] bg-white border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in duration-100 origin-top-left">
                                    {searchQuery.trim() ? (
                                        <>
                                            <div className="p-3 bg-gray-50 border-b flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-500">
                                                {t('nav.search_results')}
                                            </div>
                                            {isSearching ? (
                                                <div className="p-4 text-center text-gray-400 text-xs">{t('nav.searching')}</div>
                                            ) : searchResults.length > 0 ? (
                                                <>
                                                    {searchResults.map(user => (
                                                        <div key={user._id} onClick={() => handleResultClick(user)} className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-b-0">
                                                            <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100">
                                                                {user.profilePic && <img src={user.profilePic} className="w-full h-full object-cover" />}
                                                            </div>
                                                            <div className="ml-3 flex-1 overflow-hidden">
                                                                <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                                                                <p className="text-[9px] text-gray-500 truncate">{user.about || user.accountType}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="p-8 text-center text-sm text-gray-500 italic">{t('nav.no_results')}</div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                                                <span className="text-xs font-black uppercase tracking-widest text-gray-500">{t('nav.recent_searches')}</span>
                                                {recentSearches.length > 0 && <button onClick={clearRecent} className="text-[10px] hover:text-red-500 text-gray-400 font-bold uppercase">{t('nav.clear')}</button>}
                                            </div>
                                            {recentSearches.length > 0 ? recentSearches.map(user => (
                                                <div key={user._id} onClick={() => handleResultClick(user)} className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 group">
                                                    <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden text-xs flex items-center justify-center font-bold text-gray-500">
                                                        {user.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" /> : '🕒'}
                                                    </div>
                                                    <div className="ml-3 flex-1 px-1">
                                                        <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                                                    </div>
                                                </div>
                                            )) : <div className="p-8 text-center text-xs text-gray-400">{t('nav.no_recent')}</div>}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Center: Logo (Mobile Only) */}
                    <Link href="/feed" className="md:hidden absolute left-1/2 -translate-x-1/2">
                        <img src="/logo_full.png" alt="SarkariMinds" className="h-7 w-auto object-contain" />
                    </Link>

                    {/* Right: Desktop Nav & Mobile Settings */}
                    <div className="flex items-center justify-end flex-1 gap-1 md:gap-2 h-full">
                        <div className="hidden lg:flex items-center h-full">
                            <Link href="/feed" onClick={clearFeedDot} className={getLinkStyles('/feed')}>
                                <div className="relative">
                                    <FiHome size={22} />
                                    {hasNewPosts && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
                                </div>
                                <span className="text-[11px] mt-1 font-medium">{t('nav.home')}</span>
                            </Link>

                            <Link href="/network" onClick={markNetworkSeen} className={getLinkStyles('/network')}>
                                <div className="relative">
                                    <FiUsers size={22} />
                                    {pendingConnections > 0 && (
                                        <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                                            {pendingConnections > 99 ? '99+' : pendingConnections}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] mt-1 font-medium">{t('nav.network')}</span>
                            </Link>

                            <Link href="/messages" onClick={markMessagesRead} className={getLinkStyles('/messages')}>
                                <div className="relative">
                                    <FiMessageCircle size={22} />
                                    {unreadMessages > 0 && (
                                        <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                                            {unreadMessages > 99 ? '99+' : unreadMessages}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] mt-1 font-medium">{t('nav.messages')}</span>
                            </Link>

                            <Link href="/notifications" onClick={markNotificationsRead} className={getLinkStyles('/notifications')}>
                                <div className="relative">
                                    <FiBell size={22} />
                                    {unreadNotifications > 0 && (
                                        <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                                            {unreadNotifications > 99 ? '99+' : unreadNotifications}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] mt-1 font-medium">{t('nav.notifications')}</span>
                            </Link>

                            <Link href={`/profile/${user?._id}`} className={getLinkStyles(`/profile/${user?._id}`)}>
                                {user?.profilePic ? (
                                    <img src={user.profilePic} className="w-6 h-6 rounded-full object-cover" alt="Profile" />
                                ) : (
                                    <FiUser size={22} />
                                )}
                                <span className="text-[11px] mt-1 font-medium">{t('nav.profile')}</span>
                            </Link>

                            {/* Settings Link for desktop ratio */}
                            <Link href="/settings" className={getLinkStyles('/settings')}>
                                <FiSettings size={22} />
                                <span className="text-[11px] mt-1 font-medium">{t('sidebar.settings') || 'Settings'}</span>
                            </Link>
                        </div>

                        {/* Mobile Settings Icon */}
                        <Link href="/settings" className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all">
                            <FiSettings size={22} />
                        </Link>
                    </div>
                </div>
            </nav>
            {/* Bottom Navigation for Mobile/Tablet */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t safe-area-bottom shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-around h-14">
                    <Link href="/feed" onClick={clearFeedDot} className={`relative flex-1 flex flex-col items-center justify-center pt-1 transition-colors ${isActive('/feed') ? 'text-blue-600' : 'text-gray-400'}`}>
                        {isActive('/feed') && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[2.5px] bg-blue-600 rounded-b-full" />}
                        <FiHome size={22} strokeWidth={isActive('/feed') ? 2.5 : 2} />
                        <span className="text-[10px] font-bold mt-0.5">{t('nav.home')}</span>
                    </Link>

                    <Link href="/network" onClick={markNetworkSeen} className={`relative flex-1 flex flex-col items-center justify-center pt-1 transition-colors ${isActive('/network') ? 'text-blue-600' : 'text-gray-400'}`}>
                        {isActive('/network') && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[2.5px] bg-blue-600 rounded-b-full" />}
                        <div className="relative">
                            <FiUsers size={22} strokeWidth={isActive('/network') ? 2.5 : 2} />
                            {pendingConnections > 0 && (
                                <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                                    {pendingConnections > 99 ? '99' : pendingConnections}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold mt-0.5">{t('nav.network')}</span>
                    </Link>

                    <Link href="/messages" onClick={markMessagesRead} className={`relative flex-1 flex flex-col items-center justify-center pt-1 transition-colors ${isActive('/messages') ? 'text-blue-600' : 'text-gray-400'}`}>
                        {isActive('/messages') && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[2.5px] bg-blue-600 rounded-b-full" />}
                        <div className="relative">
                            <FiMessageCircle size={22} strokeWidth={isActive('/messages') ? 2.5 : 2} />
                            {unreadMessages > 0 && (
                                <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                                    {unreadMessages > 99 ? '99' : unreadMessages}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold mt-0.5">{t('nav.messages')}</span>
                    </Link>

                    <Link href="/notifications" onClick={markNotificationsRead} className={`relative flex-1 flex flex-col items-center justify-center pt-1 transition-colors ${isActive('/notifications') ? 'text-blue-600' : 'text-gray-400'}`}>
                        {isActive('/notifications') && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[2.5px] bg-blue-600 rounded-b-full" />}
                        <div className="relative">
                            <FiBell size={22} strokeWidth={isActive('/notifications') ? 2.5 : 2} />
                            {unreadNotifications > 0 && (
                                <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                                    {unreadNotifications > 99 ? '99' : unreadNotifications}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold mt-0.5">{t('nav.notifications')}</span>
                    </Link>

                    <Link href={`/profile/${user?._id}`} className={`relative flex-1 flex flex-col items-center justify-center pt-1 transition-colors ${pathname === `/profile/${user?._id}` ? 'text-blue-600' : 'text-gray-400'}`}>
                        {pathname === `/profile/${user?._id}` && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[2.5px] bg-blue-600 rounded-b-full" />}
                        <div className={`w-6 h-6 rounded-full border-[1.5px] transition-all ${pathname === `/profile/${user?._id}` ? 'border-blue-600' : 'border-gray-300'}`}>
                            {user?.profilePic ? (
                                <img src={user.profilePic} className="w-full h-full rounded-full object-cover" alt="Me" />
                            ) : (
                                <FiUser size={18} />
                            )}
                        </div>
                        <span className="text-[10px] font-bold mt-0.5">{t('nav.profile')}</span>
                    </Link>
                </div>
            </div>
        </>
    );
}
