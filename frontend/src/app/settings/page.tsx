'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

const EXAMS_LIST = [
    'KPSC KAS', 'FDA (First Division Assistant)', 'SDA (Second Division Assistant)',
    'PDO (Panchayat Development Officer)', 'PSI (Police Sub-Inspector)',
    'Police Constable', 'KPTCL AE/JE', 'HESCOM/BESCOM', 'TET (Teachers Eligibility Test)',
    'Village Accountant', 'PWD AE/JE', 'Groups A, B & C'
];

export default function SettingsPage() {
    const { user, updateUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications'>('profile');
    const [isSaving, setIsSaving] = useState(false);

    // Profile Settings State
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        about: user?.about || '',
        exams: user?.exams || [] as string[]
    });

    const toggleExam = (exam: string) => {
        if (profileData.exams.includes(exam)) {
            setProfileData({ ...profileData, exams: profileData.exams.filter(e => e !== exam) });
        } else {
            setProfileData({ ...profileData, exams: [...profileData.exams, exam] });
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch('http://localhost:5000/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({
                    name: profileData.name,
                    about: profileData.about,
                    exams: profileData.exams
                })
            });

            if (res.ok) {
                const updated = await res.json();
                updateUser({
                    name: updated.name,
                    about: updated.about,
                    exams: updated.exams
                });
                alert('Profile updated successfully!');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-6xl mx-auto pt-24 px-4 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden lg:block w-1/4">
                    <Sidebar />
                </div>

                <div className="flex-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
                        <div className="p-8 md:p-10 border-b bg-white">
                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Portal Settings</h1>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Refine your aspirant identity</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[500px]">
                            {/* Tabs Navigation */}
                            <div className="bg-gray-50/50 border-r border-gray-100">
                                <div className="p-4 space-y-2">
                                    <button
                                        onClick={() => setActiveTab('profile')}
                                        className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-white text-blue-700 shadow-md border border-blue-100' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
                                    >
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('account')}
                                        className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'account' ? 'bg-white text-blue-700 shadow-md border border-blue-100' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
                                    >
                                        Account Security
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('notifications')}
                                        className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'notifications' ? 'bg-white text-blue-700 shadow-md border border-blue-100' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
                                    >
                                        Notification Rules
                                    </button>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="p-8 md:p-12 bg-white">
                                {activeTab === 'profile' && (
                                    <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Identity Name</label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professional / Aspirant Bio</label>
                                            <textarea
                                                rows={4}
                                                value={profileData.about}
                                                onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
                                                placeholder="Tell your story..."
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-2xl font-medium transition-all resize-none text-gray-800 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-400">Targeting Exams (Karnataka Focus)</label>
                                            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto no-scrollbar p-1 border-t border-b border-gray-50 py-3">
                                                {EXAMS_LIST.map(exam => (
                                                    <button
                                                        key={exam}
                                                        type="button"
                                                        onClick={() => toggleExam(exam)}
                                                        className={`px-3 py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${profileData.exams.includes(exam) ? 'bg-blue-700 border-blue-700 text-white shadow-md' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300'}`}
                                                    >
                                                        {exam}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase px-1 leading-relaxed">Updating these will immediately refresh your targeting sections across the portal.</p>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="w-full md:w-auto px-12 py-5 bg-[#1a237e] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                        >
                                            {isSaving ? 'Processing Update...' : 'Update Portal Profile'}
                                        </button>
                                    </form>
                                )}

                                {activeTab === 'account' && (
                                    <div className="space-y-8 animate-in fade-in duration-300">
                                        <div className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100">
                                            <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight mb-2">Password Firewall</h3>
                                            <p className="text-xs text-blue-700/70 font-bold mb-6 italic leading-relaxed">Ensure your account is shielded by rotating your credentials periodically.</p>
                                            <button className="px-8 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 hover:text-white transition-all shadow-sm">Change Security Key</button>
                                        </div>

                                        <div className="p-8 bg-black text-white rounded-[2rem] shadow-2xl">
                                            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2">Account Decommission</h3>
                                            <p className="text-xs text-gray-400 font-bold mb-6 italic leading-relaxed">Permanently erase your identity, posts, and connection history from the network.</p>
                                            <button className="px-8 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg">Execute Deletion</button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        {[
                                            { title: 'Email Digest', desc: 'Summary of most relevant exam news' },
                                            { title: 'Instant Mentions', desc: 'Alerts when someone tags you in a post' },
                                            { title: 'Connection Updates', desc: 'News when your connections share content' }
                                        ].map((n, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-gray-200 transition-all group">
                                                <div>
                                                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-700 transition-colors">{n.title}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{n.desc}</p>
                                                </div>
                                                <div className="w-14 h-7 bg-blue-700 rounded-full relative p-1 cursor-pointer shadow-inner">
                                                    <div className="w-5 h-5 bg-white rounded-full ml-auto shadow-md"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] border shadow-sm p-6 text-center">
                        <button
                            onClick={logout}
                            className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] hover:text-black transition-all"
                        >
                            Log Out of Network
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
