'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import debounce from 'lodash.debounce';

interface SearchUser {
    _id: string;
    name: string;
    profilePic: string;
    accountType: string;
    about?: string;
}

export default function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();

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
                setUnreadNotifications(data.notifications || 0);
                setUnreadMessages(data.messages || 0);
                setPendingConnections(data.connections || 0);
            }
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
        <nav className="sticky top-0 z-50 bg-white border-b px-6 py-2 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    <Link href="/feed" className="text-2xl font-bold text-blue-800 flex-shrink-0">SarkariMinds</Link>

                    {/* Global Search Bar */}
                    <div className="relative hidden md:block w-72" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit}>
                            <input
                                type="text"
                                placeholder="Search..."
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
                                            Search Results
                                        </div>
                                        {isSearching ? (
                                            <div className="p-4 text-center text-gray-400 text-xs">Searching...</div>
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
                                                    See all results
                                                </div>
                                            </>
                                        ) : (
                                            <div className="p-8 text-center text-sm text-gray-500 italic">No results found</div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                                            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Recent Searches</span>
                                            {recentSearches.length > 0 && (
                                                <button onClick={clearRecent} className="text-[10px] hover:text-red-500 text-gray-400 font-bold uppercase tracking-wider">Clear</button>
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
                                                No recent searches
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="hidden lg:flex space-x-6">
                        {/* Home - Shows dot if new posts */}
                        <Link href="/feed" className="relative text-gray-600 hover:text-blue-800 font-medium transition-colors">
                            Home
                            {hasNewPosts && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                        </Link>

                        {/* My Network */}
                        <Link href="/network" className="relative text-gray-600 hover:text-blue-800 font-medium transition-colors">
                            My Network
                            {pendingConnections > 0 && (
                                <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                    {pendingConnections > 99 ? '99+' : pendingConnections}
                                </span>
                            )}
                        </Link>

                        {/* Messages - Shows count */}
                        <Link href="/messages" className="relative text-gray-600 hover:text-blue-800 font-medium transition-colors">
                            Messages
                            {unreadMessages > 0 && (
                                <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                    {unreadMessages > 99 ? '99+' : unreadMessages}
                                </span>
                            )}
                        </Link>

                        {/* Notifications - Shows count */}
                        <Link href="/notifications" className="relative text-gray-600 hover:text-blue-800 font-medium transition-colors">
                            Notifications
                            {unreadNotifications > 0 && (
                                <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                                </span>
                            )}
                        </Link>

                        {/* My Profile */}
                        <Link href={`/profile/${user?._id}`} className="text-gray-600 hover:text-blue-800 font-medium transition-colors">
                            My Profile
                        </Link>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    <Link href="/settings" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition text-xl">
                        ⚙️
                    </Link>

                    <div className="hidden sm:flex items-center space-x-3 border-l pl-6">
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-900">{user?.name || 'Aspirant'}</p>
                            <button onClick={logout} className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Logout</button>
                        </div>
                        <Link href={`/profile/${user?._id}`} className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center text-white font-bold border-2 border-blue-200 uppercase overflow-hidden hover:scale-110 transition-transform">
                            {user?.profilePic ? (
                                <img src={user.profilePic} className="w-full h-full object-cover" />
                            ) : (
                                <span>{user?.name ? user.name.charAt(0) : '?'}</span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
