'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user || user.role !== 'admin') {
                if (pathname !== '/admin/login') {
                    router.push('/admin/login');
                }
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, loading, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    if (!isAuthorized) {
        return null; // Will redirect
    }

    const navItems = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
        { name: 'Mentors', href: '/admin/mentors', icon: '🎓' },
        { name: 'Academies', href: '/admin/academies', icon: '🏛️' },
        { name: 'Users', href: '/admin/users', icon: '👥' },
        { name: 'Content', href: '/admin/content', icon: '📝' },
        { name: 'Ads', href: '/admin/ads', icon: '📢' },
        { name: 'Exam News', href: '/admin/exam-news', icon: '📰' },
        { name: 'Daily Newspaper', href: '/admin/daily-newspaper', icon: '🗞️' },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full transition-all duration-300">
                <div className="p-6">
                    <h1 className="text-2xl font-black tracking-tighter text-blue-500">ADMIN PANEL</h1>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">NammaSarkaari</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${pathname === item.href
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'hover:bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                        >
                            <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                            <span className="font-bold">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={() => router.push('/')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                    >
                        <span>🏠</span>
                        <span className="font-bold text-sm text-left">Back to Website</span>
                    </button>
                    <div className="mt-4 flex items-center gap-3 px-4 py-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                            {user?.name?.[0] || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{user?.name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 p-8 min-h-screen">
                {children}
            </main>
        </div>
    );
}
