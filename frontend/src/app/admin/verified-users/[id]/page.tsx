'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';

interface User {
    _id: string;
    name: string;
    email: string;
    mobile?: string;
    role: string;
    verificationApprovedAt?: string;
    isBlocked?: boolean;
    mentorApplication?: {
        documents?: string[];
    };
    academyApplication?: {
        documents?: string[];
    };
}

interface Community {
    _id: string;
    name: string;
    isPaid: boolean;
    price: number;
    examCategory: string;
    memberCount: number;
    status: string;
}

interface Payment {
    _id: string;
    user?: {
        name: string;
        email: string;
    };
    amountPaid: number;
    paymentStatus: string;
    createdAt: string;
}

interface UserDetails {
    user: User;
    communities: Community[];
    payments: Payment[];
    stats: {
        totalCommunities: number;
        paidCommunities: number;
        totalEarnings: number;
    };
}

export default function VerifiedUserDetailsPage() {
    const { user: adminUser } = useAuth();
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [revokeReason, setRevokeReason] = useState('');
    const [revoking, setRevoking] = useState(false);

    const fetchUserDetails = useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/verified-users/${id}`, {
                headers: { 'Authorization': `Bearer ${adminUser?.token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [adminUser?.token, id]);

    useEffect(() => {
        if (adminUser?.token && id) {
            fetchUserDetails();
        }
    }, [adminUser?.token, id, fetchUserDetails]);

    const handleRevoke = async () => {
        if (!revokeReason.trim()) {
            alert('Please provide a reason for revocation');
            return;
        }

        setRevoking(true);
        try {
            const res = await fetch(`http://localhost:5000/api/admin/verified-users/revoke/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser?.token}`
                },
                body: JSON.stringify({ reason: revokeReason })
            });

            if (res.ok) {
                alert('Verification revoked successfully');
                router.push('/admin/verified-users');
            } else {
                alert('Failed to revoke verification');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        } finally {
            setRevoking(false);
            setShowRevokeModal(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (!data) return <div className="text-center p-20 font-bold text-gray-500">User not found</div>;

    const { user, communities, payments, stats } = data;

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-xl hover:bg-gray-50 transition-colors"
                    >
                        ←
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{user?.name || 'User Details'}</h1>
                        <p className="text-gray-500 font-medium">Viewing full profile and activity details</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowRevokeModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-black px-8 py-4 rounded-2xl transition shadow-lg shadow-red-600/20 uppercase text-xs tracking-widest whitespace-nowrap"
                >
                    Remove Verification
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile & Stats */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Basic Info */}
                    <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-3xl text-white font-bold">
                                {user?.name?.[0] || '?'}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 capitalize">{user.role}</h3>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile Number</p>
                                <p className="text-sm font-bold text-gray-700">{user.mobile || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Verification Date</p>
                                <p className="text-sm font-bold text-gray-700">{user.verificationApprovedAt ? new Date(user.verificationApprovedAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.isBlocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {user.isBlocked ? 'Suspended' : 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-xl">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Financial Summary</h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-3xl font-black text-white">₹{stats?.totalEarnings?.toLocaleString() || '0'}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total Generated Revenue</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-800">
                                <div>
                                    <p className="text-xl font-black text-blue-400">{stats.totalCommunities}</p>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">Total Groups</p>
                                </div>
                                <div>
                                    <p className="text-xl font-black text-green-400">{stats.paidCommunities}</p>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">Paid Groups</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Verified Documents</h3>
                        <div className="space-y-3">
                            {(user.mentorApplication?.documents || user.academyApplication?.documents || []).map((doc: string, i: number) => (
                                <a
                                    key={i}
                                    href={doc}
                                    target="_blank"
                                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 group"
                                >
                                    <span className="text-sm font-bold text-gray-600">Document #{i + 1}</span>
                                    <span className="text-blue-600 group-hover:translate-x-1 transition-transform">↗</span>
                                </a>
                            ))}
                            {(!user.mentorApplication?.documents && !user.academyApplication?.documents) && (
                                <p className="text-sm text-gray-400 italic">No documents uploaded</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Content & Activity */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Communities */}
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-900">Created Communities</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {communities?.map((c) => (
                                <div key={c._id} className="p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                                            {c.isPaid ? '💰' : '🤝'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{c.name}</p>
                                            <p className="text-xs text-gray-400 uppercase tracking-widest font-black">{c.examCategory} • {c.memberCount} Members</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900">{c.isPaid ? `₹${c.price}` : 'FREE'}</p>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${c.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                                            {c.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {communities?.length === 0 && (
                                <div className="p-12 text-center text-gray-400 italic">No communities created yet</div>
                            )}
                        </div>
                    </div>

                    {/* Payment Activity */}
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50">
                            <h3 className="text-xl font-black text-gray-900">Recent Payment proof Submissions</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Student</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {payments?.map((p) => (
                                        <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-8 py-4">
                                                <p className="font-bold text-gray-900 text-sm">{p.user?.name}</p>
                                                <p className="text-[10px] text-gray-400">{p.user?.email}</p>
                                            </td>
                                            <td className="px-8 py-4">
                                                <p className="font-black text-gray-900 text-sm">₹{p.amountPaid}</p>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${p.paymentStatus === 'active' ? 'bg-green-100 text-green-600' :
                                                    p.paymentStatus === 'expired' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                                    }`}>
                                                    {p.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-xs font-bold text-gray-500">
                                                {new Date(p.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {payments?.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-12 text-center text-gray-400 italic">No payment activity found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revoke Modal */}
            {showRevokeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowRevokeModal(false)}></div>
                    <div className="bg-white rounded-[40px] p-10 max-w-lg w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-4xl mb-6">⚠️</div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Revoke Verification?</h2>
                        <p className="text-gray-500 font-medium mb-8">This will downgrade the user to a Student role. This action will be logged and the user will be notified.</p>

                        <div className="mb-8">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Reason for Revocation</label>
                            <textarea
                                value={revokeReason}
                                onChange={(e) => setRevokeReason(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none transition-all h-32"
                                placeholder="E.g., Fraudulent activity, misleading information, etc."
                            ></textarea>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowRevokeModal(false)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-4 rounded-2xl transition uppercase text-xs tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRevoke}
                                disabled={revoking}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-red-600/20 uppercase text-xs tracking-widest disabled:opacity-50"
                            >
                                {revoking ? 'Processing...' : 'Yes, Revoke'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
