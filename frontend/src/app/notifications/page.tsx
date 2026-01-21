'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    _id: string;
    type: 'like' | 'comment' | 'follow' | 'connection_request' | 'connection_accept' | 'mention' | 'connection_accepted' | 'story_reaction' | 'story_reply' | 'new_post';
    sender: {
        _id: string;
        name: string;
        profilePic: string;
    };
    post?: string;
    comment?: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await fetch('http://localhost:5000/api/notifications', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setNotifications(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            const res = await fetch('http://localhost:5000/api/notifications/read', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                // Trigger navbar update
                window.dispatchEvent(new Event('notificationsUpdated'));
            }
        } catch (err) { console.error(err); }
    };

    const markSingleAsRead = async (id: string) => {
        if (!user) return;
        try {
            const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
                window.dispatchEvent(new Event('notificationsUpdated'));
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user]);

    const getNotificationContent = (notification: Notification) => {
        switch (notification.type) {
            case 'like': return 'liked your post';
            case 'comment': return 'commented on your post';
            case 'follow': return 'started following you';
            case 'connection_request': return 'sent you a connection request';
            case 'connection_accepted': return 'accepted your connection request';
            case 'mention': return 'mentioned you in a post';
            case 'story_reaction': return 'reacted to your story';
            case 'story_reply': return 'replied to your story';
            case 'new_post': return 'shared a new post';
            default: return 'sent you a notification';
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'like': return '❤️';
            case 'comment': return '💬';
            case 'follow': return '👤';
            case 'connection_request': return '🤝';
            case 'connection_accept': return '✅';
            case 'mention': return '🏷️';
            default: return '🔔';
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-6xl mx-auto pt-24 px-4 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden lg:block w-1/4">
                    <Sidebar />
                </div>

                <div className="flex-1 space-y-4">
                    <div className="bg-white rounded-2xl border shadow-sm p-6 flex justify-between items-center">
                        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Notifications</h1>
                        <button
                            onClick={markAllAsRead}
                            className="text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline"
                        >
                            Mark all as read
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-20 text-center animate-pulse text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                Loading feeds...
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((n) => {
                                    if (!n.sender) return null;
                                    return (
                                        <div
                                            key={n._id}
                                            onClick={() => !n.isRead && markSingleAsRead(n._id)}
                                            className={`p-6 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-50/50 border-l-4 border-blue-700' : ''}`}
                                        >
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-blue-50 border overflow-hidden flex items-center justify-center font-bold text-blue-700 uppercase">
                                                    {n.sender.profilePic ? <img src={n.sender.profilePic} className="w-full h-full object-cover" /> : n.sender.name.charAt(0)}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full shadow-sm w-6 h-6 flex items-center justify-center text-xs border">
                                                    {getNotificationIcon(n.type)}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800">
                                                    <Link href={`/profile/${n.sender._id}`} className="font-black hover:text-blue-700">{n.sender.name}</Link>
                                                    {' '}{getNotificationContent(n)}
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                    {formatDistanceToNow(new Date(n.createdAt))} ago
                                                </p>
                                            </div>
                                            {!n.isRead && (
                                                <div className="w-2 h-2 bg-blue-700 rounded-full mt-2"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-20 text-center">
                                <div className="text-4xl mb-4">🔔</div>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">All caught up!</h3>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">No new notifications for you</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
