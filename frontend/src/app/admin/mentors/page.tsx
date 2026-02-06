'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface PendingMentor {
    _id: string;
    name: string;
    email: string;
    mobile?: string;
    experience?: string;
    expertise?: string[];
    createdAt: string;
    mentorApplication?: {
        documents?: string[];
    };
}

export default function AdminMentors() {
    const { user } = useAuth();
    const [mentors, setMentors] = useState<PendingMentor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.token) {
            fetchMentors();
        }
    }, [user]);

    const fetchMentors = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/mentors/pending', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMentors(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: string, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} this mentor?`)) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/mentors/${action}/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                }
            });
            if (res.ok) {
                alert(`Mentor ${action}ed successfully`);
                fetchMentors();
            } else {
                alert(`Failed to ${action} mentor`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="animate-pulse text-gray-400 font-bold p-8 text-center uppercase tracking-widest">Loading Applications...</div>;

    return (
        <div>
            <header className="mb-10">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mentor Verification</h1>
                <p className="text-gray-500 mt-2 font-medium">Review and process pending mentor applications.</p>
            </header>

            <div className="space-y-6">
                {mentors.map((mentor) => (
                    <div key={mentor._id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-xl transition-all duration-300">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">{mentor.name}</h3>
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg">Pending</span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                                <span className="flex items-center gap-1">📧 {mentor.email}</span>
                                {mentor.mobile && <span className="flex items-center gap-1">📞 {mentor.mobile}</span>}
                                <span className="flex items-center gap-1">📅 Applied: {new Date(mentor.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-sm font-bold text-gray-700 mb-2 underline decoration-blue-500 decoration-2 underline-offset-4">Application Details</p>
                                <p className="text-sm text-gray-600 mb-2"><span className="font-bold">Experience:</span> {mentor.experience || 'Not specified'}</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-sm font-bold text-gray-600">Expertise:</span>
                                    {mentor.expertise?.map((exp, i) => (
                                        <span key={i} className="text-xs bg-white px-2 py-1 rounded-lg border border-gray-200 text-gray-600 font-medium">#{exp}</span>
                                    ))}
                                </div>
                                {mentor.mentorApplication?.documents && mentor.mentorApplication.documents.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-sm font-bold text-gray-700 mb-2">📎 Supporting Documents:</p>
                                        <div className="space-y-2">
                                            {mentor.mentorApplication.documents.map((doc, i) => (
                                                <a
                                                    key={i}
                                                    href={`http://localhost:5000/${doc}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-blue-50 transition-colors border border-gray-200 group"
                                                >
                                                    <span className="text-xs font-bold text-gray-600">Document #{i + 1}</span>
                                                    <span className="text-blue-600 group-hover:translate-x-1 transition-transform">↗</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex md:flex-col gap-3 w-full md:w-auto">
                            <button
                                onClick={() => handleAction(mentor._id, 'approve')}
                                className="flex-1 md:w-40 bg-green-600 hover:bg-green-700 text-white font-black py-4 px-6 rounded-2xl transition shadow-lg shadow-green-600/20 uppercase text-xs tracking-widest"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => handleAction(mentor._id, 'reject')}
                                className="flex-1 md:w-40 bg-red-50 hover:bg-red-100 text-red-600 font-black py-4 px-6 rounded-2xl transition border border-red-200 uppercase text-xs tracking-widest"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                ))}

                {mentors.length === 0 && (
                    <div className="bg-white p-16 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center opacity-50">
                        <span className="text-6xl mb-4">✨</span>
                        <p className="text-gray-500 font-bold uppercase tracking-widest">Inbox Zero! No pending mentors.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
