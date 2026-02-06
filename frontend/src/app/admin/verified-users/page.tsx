'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface VerifiedUser {
    _id: string;
    name: string;
    email: string;
    mobile?: string;
    role: 'mentor' | 'academy';
    verificationApprovedAt: string;
    communityCount: number;
    paidCommunityCount: number;
    isBlocked: boolean;
}

export default function VerifiedUsersPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<VerifiedUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchVerifiedUsers = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/verified-users', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    useEffect(() => {
        if (user?.token) {
            fetchVerifiedUsers();
        }
    }, [user?.token, fetchVerifiedUsers]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Verified Mentors & Academies</h1>
                    <p className="text-gray-500 mt-2 font-medium">Manage and monitor all verified creators on the platform.</p>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-black text-blue-600 leading-none">{users.length}</span>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Total Verified</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((u) => (
                    <Link
                        key={u._id}
                        href={`/admin/verified-users/${u._id}`}
                        className="bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {u.role === 'mentor' ? '🎓' : '🏛️'}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.isBlocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {u.isBlocked ? 'Suspended' : 'Active'}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                            {u.name || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 truncate">{u.email}</p>

                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50 mb-4">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Role</p>
                                <p className="text-sm font-bold text-gray-700 capitalize">{u.role}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Verified On</p>
                                <p className="text-sm font-bold text-gray-700">{u.verificationApprovedAt ? new Date(u.verificationApprovedAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1 bg-gray-50 rounded-2xl p-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Communities</p>
                                <p className="text-lg font-black text-gray-900">{u.communityCount}</p>
                            </div>
                            <div className="flex-1 bg-blue-50 rounded-2xl p-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Paid</p>
                                <p className="text-lg font-black text-blue-600">{u.paidCommunityCount}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {users.length === 0 && (
                <div className="bg-white p-20 rounded-[40px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-6">🔍</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No verified users found</h3>
                    <p className="text-gray-500 max-w-sm">There are currently no users with mentor or academy status in the system.</p>
                </div>
            )}
        </div>
    );
}
