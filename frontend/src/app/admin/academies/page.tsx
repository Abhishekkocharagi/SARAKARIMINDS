'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface PendingAcademy {
    _id: string;
    name: string;
    email: string;
    mobile?: string;
    academyDetails?: {
        academyName: string;
        location: string;
        website?: string;
        description?: string;
    };
    createdAt: string;
}

export default function AdminAcademies() {
    const { user } = useAuth();
    const [academies, setAcademies] = useState<PendingAcademy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.token) {
            fetchAcademies();
        }
    }, [user]);

    const fetchAcademies = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/academies/pending', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAcademies(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: string, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} this academy?`)) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/academies/${action}/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                }
            });
            if (res.ok) {
                alert(`Academy ${action}ed successfully`);
                fetchAcademies();
            } else {
                alert(`Failed to ${action} academy`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="animate-pulse text-gray-400 font-bold p-8 text-center uppercase tracking-widest">Loading Applications...</div>;

    return (
        <div>
            <header className="mb-10">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Academy Verification</h1>
                <p className="text-gray-500 mt-2 font-medium">Review and process pending academy registrations.</p>
            </header>

            <div className="space-y-6">
                {academies.map((aca) => (
                    <div key={aca._id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-xl transition-all duration-300">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">{aca.academyDetails?.academyName || 'No Name'}</h3>
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg">Pending Academy</span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                                <span className="flex items-center gap-1">👤 Contact: {aca.name}</span>
                                <span className="flex items-center gap-1">📧 {aca.email}</span>
                                <span className="flex items-center gap-1">📍 {aca.academyDetails?.location || 'Unknown Location'}</span>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <p className="text-sm font-bold text-gray-700 mb-2 underline decoration-purple-500 decoration-2 underline-offset-4">Institution Profile</p>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{aca.academyDetails?.description || 'No description provided.'}</p>
                                {aca.academyDetails?.website && (
                                    <a
                                        href={aca.academyDetails.website}
                                        target="_blank"
                                        className="inline-flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 bg-white px-3 py-2 rounded-lg border border-gray-200 transition shadow-sm"
                                    >
                                        🌐 Visit Official Website
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex md:flex-col gap-3 w-full md:w-auto">
                            <button
                                onClick={() => handleAction(aca._id, 'approve')}
                                className="flex-1 md:w-40 bg-green-600 hover:bg-green-700 text-white font-black py-4 px-6 rounded-2xl transition shadow-lg shadow-green-600/20 uppercase text-xs tracking-widest"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => handleAction(aca._id, 'reject')}
                                className="flex-1 md:w-40 bg-red-50 hover:bg-red-100 text-red-600 font-black py-4 px-6 rounded-2xl transition border border-red-200 uppercase text-xs tracking-widest"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                ))}

                {academies.length === 0 && (
                    <div className="bg-white p-16 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center opacity-50">
                        <span className="text-6xl mb-4">🏛️</span>
                        <p className="text-gray-500 font-bold uppercase tracking-widest">Inbox Zero! No pending academies.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
