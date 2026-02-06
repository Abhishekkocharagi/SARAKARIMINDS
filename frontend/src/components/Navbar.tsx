'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter, usePathname } from 'next/navigation';
import debounce from 'lodash.debounce';

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
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/feed') return pathname === '/feed' || pathname === '/';
        return pathname?.startsWith(path);
    };

    const getLinkStyles = (path: string) => `
        relative h-full flex items-center px-1 border-b-2 transition-all duration-200
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

    // Refs for click outside
    const searchRef = useRef<HTMLDivElement>(null);

    // Fetch Recent Searches
    const fetchRecentSearches = async () => {
        if (!user) return;
        try {
            const res = await fetch('http://localhost:5000/api/users/recent-search', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setRecentSearches(data);
        } catch (err) { console.error(err); }
    };

    // Fetch Notification Counts
    const fetchNotificationCounts = async () => {
        if (!user) return;
        try {
            const res = await fetch('http://localhost:5000/api/notifications/unread-counts', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (data) {
                setUnreadNotifications(Number(data.notifications) || 0);
                setUnreadMessages(Number(data.messages) || 0);
                setPendingConnections(Number(data.connections) || 0);
                setHasNewPosts(!!data.hasNewPosts);
            }
        } catch (err) { console.error(err); }
    };

    const markNetworkSeen = async () => {
        setPendingConnections(0);
        try {
            await fetch('http://localhost:5000/api/connections/mark-seen', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
        } catch (err) { console.error(err); }
    };

    const markMessagesRead = async () => {
        setUnreadMessages(0);
        try {
            await fetch('http://localhost:5000/api/messages/read-all', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
        } catch (err) { console.error(err); }
    };

    const markNotificationsRead = async () => {
        setUnreadNotifications(0);
        try {
            await fetch('http://localhost:5000/api/notifications/read', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
        } catch (err) { console.error(err); }
    };

    const clearFeedDot = async () => {
        setHasNewPosts(false);
        try {
            await fetch('http://localhost:5000/api/posts/last-visit', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
        } catch (err) { console.error(err); }
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
            try {
                const res = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                const data = await res.json();
                console.log('Frontend Search Results Count:', data.length);
                setSearchResults(data);
            } catch (err) { console.error(err); }
            finally { setIsSearching(false); }
        }, 300)
    ).current;

    // Effects
    useEffect(() => {
        if (user) {
            fetchRecentSearches();
            fetchNotificationCounts();

            // Poll for updates every 30 seconds
            const interval = setInterval(() => {
                fetchNotificationCounts();
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

        // Add to recent searches API
        try {
            const res = await fetch('http://localhost:5000/api/users/recent-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify({ targetUserId: targetUser._id })
            });
            if (res.ok) fetchRecentSearches(); // Update local list
        } catch (err) { console.error(err); }
    };

    const clearRecent = async () => {
        try {
            await fetch('http://localhost:5000/api/users/recent-search', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            setRecentSearches([]);
        } catch (err) { console.error(err); }
    };

    return (
        <nav className="sticky top-0 z-50 bg-white border-b px-6 h-16 shadow-sm">
            <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
                <Link href="/feed" className="flex-shrink-0 mr-8">
                    <img src="/logo_full.png" alt="SarkariMinds" className="h-6 md:h-8 w-auto object-contain" />
                </Link>

                <div className="flex items-center space-x-8">
                    {/* Global Search Bar */}
                    <div className="relative hidden md:block w-80" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit}>
                            <input
                                type="text"
                                placeholder={t('nav.search')}
                                value={searchQuery}
                                onFocus={() => setShowSearchDropdown(true)}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-full text-sm outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        </form>

                        {/* Search Dropdown */}
                        {showSearchDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-80 bg-white border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150 origin-top-left">
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
                                                    <div
                                                        key={user._id}
                                                        onClick={() => handleResultClick(user)}
                                                        className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-b-0"
                                                    >
                                                        <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100">
                                                            {user.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" /> : null}
                                                        </div>
                                                        <div className="ml-3 flex-1 overflow-hidden">
                                                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                                            <p className={`text-[10px] text-gray-500 tracking-wide truncate ${!user.about ? 'uppercase' : ''}`}>{user.about || user.accountType}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div
                                                    onClick={handleSearchSubmit}
                                                    className="block p-3 text-center text-xs font-bold text-blue-700 bg-gray-50 hover:bg-gray-100 border-t cursor-pointer transition uppercase tracking-widest"
                                                >
                                                    {t('nav.see_all')}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="p-8 text-center text-sm text-gray-500 italic">{t('nav.no_results')}</div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                                            <span className="text-xs font-black uppercase tracking-widest text-gray-500">{t('nav.recent_searches')}</span>
                                            {recentSearches.length > 0 && (
                                                <button onClick={clearRecent} className="text-[10px] hover:text-red-500 text-gray-400 font-bold uppercase tracking-wider">{t('nav.clear')}</button>
                                            )}
                                        </div>
                                        {recentSearches.length > 0 ? (
                                            recentSearches.map(user => (
                                                <div
                                                    key={user._id}
                                                    onClick={() => handleResultClick(user)}
                                                    className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0 group"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 text-xs flex items-center justify-center font-bold text-gray-500">
                                                        {user.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" /> : '🕒'}
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{user.name}</p>
                                                    </div>
                                                    <span className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-xs text-gray-400">
                                                {t('nav.no_recent')}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="hidden lg:flex space-x-8 xl:space-x-12 h-full">
                        {/* Home - Shows dot if new posts */}
                        <Link href="/feed" onClick={clearFeedDot} className={getLinkStyles('/feed')}>
                            {t('nav.home')}
                            {hasNewPosts && (
                                <span className="absolute top-4 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                        </Link>

                        {/* My Network */}
                        <Link href="/network" onClick={markNetworkSeen} className={getLinkStyles('/network')}>
                            {t('nav.network')}
                            {pendingConnections > 0 && (
                                <span className="absolute top-3 -right-3 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                    {pendingConnections > 99 ? '99+' : pendingConnections}
                                </span>
                            )}
                        </Link>

                        {/* Messages - Shows count */}
                        <Link href="/messages" onClick={markMessagesRead} className={getLinkStyles('/messages')}>
                            {t('nav.messages')}
                            {unreadMessages > 0 && (
                                <span className="absolute top-3 -right-3 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                    {unreadMessages > 99 ? '99+' : unreadMessages}
                                </span>
                            )}
                        </Link>

                        {/* Notifications - Shows count */}
                        <Link href="/notifications" onClick={markNotificationsRead} className={getLinkStyles('/notifications')}>
                            {t('nav.notifications')}
                            {unreadNotifications > 0 && (
                                <span className="absolute top-3 -right-3 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                                </span>
                            )}
                        </Link>

                        {/* My Profile */}
                        <Link href={`/profile/${user?._id}`} className={getLinkStyles(`/profile/${user?._id}`)}>
                            {t('nav.profile')}
                        </Link>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    <Link href="/settings" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition text-xl">
                        ⚙️
                    </Link>


                </div>
            </div>
        </nav>
    );
}
