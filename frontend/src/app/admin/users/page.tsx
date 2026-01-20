'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    isBlocked?: boolean;
    createdAt: string;
}

export default function AdminUsers() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (currentUser?.token) {
            fetchUsers();
        }
    }, [currentUser]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
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
    };

    const handleBlockAction = async (userId: string, isBlocked: boolean) => {
        const action = isBlocked ? 'unblock' : 'block';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${action}/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${currentUser?.token}`
                }
            });
            if (res.ok) {
                alert(`User ${action}ed successfully`);
                fetchUsers();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="animate-pulse text-gray-400 font-bold p-8 text-center uppercase tracking-widest">Loading User Directory...</div>;

    return (
        <div>
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">User Directory</h1>
                    <p className="text-gray-500 mt-2 font-medium">Manage platform users and account status.</p>
                </div>
                <div className="w-full md:w-96 relative">
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-200 p-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-30">🔍</span>
                </div>
            </header>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <th className="px-8 py-6">User</th>
                            <th className="px-8 py-6">Role</th>
                            <th className="px-8 py-6">Joined</th>
                            <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((u) => (
                            <tr key={u._id} className="hover:bg-gray-50 transition group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition">
                                            {u.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{u.name}</p>
                                            <p className="text-xs text-gray-500">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                            u.role === 'mentor' ? 'bg-blue-100 text-blue-700' :
                                                u.role === 'academy' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    {u.role !== 'admin' && (
                                        <button
                                            onClick={() => handleBlockAction(u._id, !!u.isBlocked)}
                                            className={`font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition ${u.isBlocked
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                }`}
                                        >
                                            {u.isBlocked ? '🔓 Unblock' : '🚫 Block'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-16 text-center opacity-30">
                        <p className="text-4xl mb-4">👻</p>
                        <p className="font-bold uppercase tracking-widest">No users found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
