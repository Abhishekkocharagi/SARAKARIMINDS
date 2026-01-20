'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiArrowLeft, FiCheck, FiBriefcase, FiGlobe, FiMapPin, FiInfo } from 'react-icons/fi';

export default function AcademyRegister() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        academyName: '',
        location: '',
        website: '',
        description: ''
    });
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/register/academy');
        }
    }, [user, authLoading, router]);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/users/apply-academy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push('/feed'), 3000);
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Application failed');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (success) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-12 border border-green-100">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiCheck size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Application Sent!</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        Thank you for your interest in partnering with us. Our team will review your academy's profile and reach out to you shortly.
                    </p>
                    <p className="text-xs text-gray-400 mt-8 font-bold uppercase tracking-widest animate-pulse">Redirecting to feed...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
            <div className="max-w-5xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">

                {/* Visual Sidebar */}
                <div className="md:w-5/12 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-12 text-white flex flex-col justify-between relative">
                    <div className="relative z-10">
                        <Link href="/feed" className="inline-flex items-center gap-2 text-blue-200 font-bold text-sm mb-12 hover:text-white transition-colors">
                            <FiArrowLeft /> Back to Feed
                        </Link>
                        <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">Academy Partner</div>
                        <h2 className="text-5xl font-black mb-6 leading-[1.1]">Digitalize Your Institute.</h2>
                        <ul className="space-y-4">
                            {[
                                { icon: <FiBriefcase />, text: "Business Profile Page" },
                                { icon: <FiGlobe />, text: "Reach dedicated aspirants" },
                                { icon: <FiInfo />, text: "Verified Partner Status" }
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-blue-100/80 font-semibold">
                                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">{item.icon}</span>
                                    {item.text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Application Form */}
                <div className="md:w-7/12 p-12 md:p-16">
                    <div className="mb-10">
                        <h3 className="text-3xl font-black text-gray-900 mb-2">Academy Application</h3>
                        <p className="text-gray-500 font-medium">Register your institute on <span className="text-blue-700 font-bold">SarkariMinds</span>.</p>
                    </div>

                    <form onSubmit={handleApply} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Academy Name</label>
                            <input
                                type="text"
                                required
                                value={formData.academyName}
                                onChange={e => setFormData({ ...formData, academyName: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-semibold text-gray-700 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                placeholder="e.g. Excellence IAS Academy"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <FiMapPin size={12} /> Location
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-semibold text-gray-700 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                    placeholder="City, State"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <FiGlobe size={12} /> Website
                                </label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-semibold text-gray-700 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-semibold text-gray-700 focus:bg-white focus:border-blue-600 outline-none transition-all min-h-[100px]"
                                placeholder="Describe your academy, courses offered, etc..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-black hover:to-black text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-100 uppercase tracking-widest active:scale-[0.98] mt-4"
                        >
                            {loading ? 'Submitting Application...' : 'Submit Application'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

