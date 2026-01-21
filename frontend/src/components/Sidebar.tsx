'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Sidebar() {
    const { user } = useAuth();

    return (
        <aside className="space-y-4">
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="h-16 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800"></div>
                <div className="px-4 pb-6 -mt-8 text-center">
                    <Link href={`/profile/${user?._id}`} className="block group">
                        <div className="w-16 h-16 bg-white border-4 border-white rounded-full mx-auto flex items-center justify-center font-bold text-blue-800 text-xl shadow-md overflow-hidden group-hover:scale-105 transition-transform">
                            {user?.profilePic ? (
                                <img src={user.profilePic} className="w-full h-full object-cover" />
                            ) : (
                                <span>{user?.name ? user.name.charAt(0) : '?'}</span>
                            )}
                        </div>
                        <h3 className="mt-2 font-bold text-lg group-hover:text-blue-700 transition-colors">{user?.name || 'Aspirant'}</h3>
                    </Link>
                    <p className="text-xs text-gray-500 mb-2 font-bold">{user?.accountType || 'User'} • Aspirant</p>
                    {user?.about && (
                        <p className="text-[10px] text-gray-400 italic mb-4 line-clamp-2 px-2">"{user.about}"</p>
                    )}
                    <div className="border-t pt-4 text-left text-[10px] space-y-3 uppercase tracking-widest font-black">
                        <Link href="/network" className="flex justify-between items-center hover:bg-gray-50 -mx-4 px-4 py-1 transition-colors cursor-pointer">
                            <span className="text-gray-400">Connections</span>
                            <span className="text-blue-700">{user?.connectionsCount || 0}</span>
                        </Link>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Followers</span>
                            <span className="text-blue-700">{user?.followersCount || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Following</span>
                            <span className="text-blue-700">{user?.followingCount || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Newspaper Link - CLEAN SINGLE ENTRY */}
            <Link href="/daily-newspaper" className="block">
                <div className="bg-white border rounded-xl p-4 shadow-sm hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl group-hover:scale-110 transition-transform">📰</span>
                        <div>
                            <h4 className="font-bold text-gray-700 group-hover:text-blue-700 transition-colors">Daily Newspaper</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Read Today's Papers</p>
                        </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </Link>

            <div className="bg-white border rounded-xl p-4 shadow-sm">
                <h4 className="font-bold text-sm mb-3 text-gray-700">My Exams</h4>
                <div className="flex flex-wrap gap-2">
                    {user?.exams?.map(exam => (
                        <span key={exam} className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600 border">
                            {exam}
                        </span>
                    ))}
                </div>
            </div>
        </aside>
    );
}
