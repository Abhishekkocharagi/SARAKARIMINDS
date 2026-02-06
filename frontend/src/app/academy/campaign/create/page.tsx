'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CreateCampaign() {
    const { user } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        type: 'profile_boost',
        budget: 1000,
        durationDays: 7,
        targetExams: '',
        locationState: '',
        locationDistrict: '',
        adTitle: '',
        adDescription: '',
        adLink: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                type: formData.type,
                budget: Number(formData.budget),
                durationDays: Number(formData.durationDays),
                targetExams: formData.targetExams.split(',').map(s => s.trim()).filter(Boolean),
                targetLocation: {
                    state: formData.locationState,
                    district: formData.locationDistrict
                },
                adContent: {
                    title: formData.adTitle,
                    description: formData.adDescription,
                    link: formData.adLink
                }
            };

            const res = await fetch('http://localhost:5000/api/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Campaign request submitted for approval!');
                router.push('/academy/campaigns');
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto pt-6 px-6 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>
                <div className="flex-1 bg-white p-8 rounded-[2rem] border shadow-sm">
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">Launch New Campaign</h1>

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                        {/* Campaign Basics */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Campaign Name</label>
                                <input type="text" required className="w-full bg-gray-50 border rounded-xl p-3 font-bold"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Goal</label>
                                <select className="w-full bg-gray-50 border rounded-xl p-3 font-bold"
                                    value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="profile_boost">Boost Profile Visits</option>
                                    <option value="post_boost">Boost Post Reach</option>
                                    <option value="banner_ad">Banner Advertisement</option>
                                </select>
                            </div>
                        </div>

                        {/* Targeting */}
                        <div className="bg-blue-50 p-6 rounded-2xl space-y-4">
                            <h3 className="font-bold text-blue-900 uppercase text-xs tracking-widest">Targeting</h3>
                            <div>
                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Exams (Comma sep)</label>
                                <input type="text" placeholder="KAS, FDA, SDA" className="w-full bg-white border rounded-xl p-3 font-bold"
                                    value={formData.targetExams} onChange={e => setFormData({ ...formData, targetExams: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">State</label>
                                    <input type="text" className="w-full bg-white border rounded-xl p-3 font-bold"
                                        value={formData.locationState} onChange={e => setFormData({ ...formData, locationState: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">District</label>
                                    <input type="text" className="w-full bg-white border rounded-xl p-3 font-bold"
                                        value={formData.locationDistrict} onChange={e => setFormData({ ...formData, locationDistrict: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Creative */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Ad Title</label>
                                <input type="text" required className="w-full bg-gray-50 border rounded-xl p-3 font-bold"
                                    value={formData.adTitle} onChange={e => setFormData({ ...formData, adTitle: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Ad Description</label>
                                <textarea rows={3} required className="w-full bg-gray-50 border rounded-xl p-3 font-medium"
                                    value={formData.adDescription} onChange={e => setFormData({ ...formData, adDescription: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Destination Link</label>
                                <input type="url" placeholder="https://..." className="w-full bg-gray-50 border rounded-xl p-3 font-bold"
                                    value={formData.adLink} onChange={e => setFormData({ ...formData, adLink: e.target.value })} />
                            </div>
                        </div>

                        {/* Budget */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Budget (₹)</label>
                                <input type="number" required className="w-full bg-gray-50 border rounded-xl p-3 font-bold"
                                    value={formData.budget} onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Duration (Days)</label>
                                <input type="number" required className="w-full bg-gray-50 border rounded-xl p-3 font-bold"
                                    value={formData.durationDays} onChange={e => setFormData({ ...formData, durationDays: Number(e.target.value) })} />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button type="button" onClick={() => router.back()} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-200">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 bg-blue-700 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-800 shadow-xl">
                                Launch Campaign
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
