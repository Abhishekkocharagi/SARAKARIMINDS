'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface Exam {
    _id: string;
    name: string;
    category: string;
}

export default function SettingsPage() {
    const { user, updateUser, logout } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'verification'>('profile');
    const [isSaving, setIsSaving] = useState(false);

    // Verification State
    const [verificationType, setVerificationType] = useState<'mentor' | 'academy' | null>(null);
    const [mentorForm, setMentorForm] = useState({ experience: '', expertise: '' });
    const [academyForm, setAcademyForm] = useState({ academyName: '', location: '', website: '', description: '' });

    // Profile Settings State
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        about: user?.about || '',
        preferredExams: user?.preferredExams?.map((e: any) => e._id || e) || [] as string[],
        receiveAllNotifications: user?.receiveAllNotifications || false
    });
    const [notificationPrefs, setNotificationPrefs] = useState({
        emailDigest: true,
        postLikes: true,
        postComments: true,
        newFollowers: true,
        connectionRequests: true,
        mentions: true,
        messages: true
    });
    const [allExams, setAllExams] = useState<Exam[]>([]);

    React.useEffect(() => {
        const fetchUserPrefs = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/users/profile', {
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.notificationPreferences) {
                        setNotificationPrefs(data.notificationPreferences);
                    }
                }
            } catch (err) { console.error(err); }
        };
        if (user) fetchUserPrefs();
    }, [user]);

    React.useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/exams');
                if (res.ok) setAllExams(await res.json());
            } catch (err) { console.error(err); }
        };
        fetchExams();
    }, []);

    const toggleExam = (examId: string) => {
        if (profileData.preferredExams.includes(examId)) {
            setProfileData({ ...profileData, preferredExams: profileData.preferredExams.filter(id => id !== examId) });
        } else {
            if (profileData.preferredExams.length >= 5) return alert('Maximum 5 exams allowed');
            setProfileData({ ...profileData, preferredExams: [...profileData.preferredExams, examId] });
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
                    preferredExams: profileData.preferredExams,
                    receiveAllNotifications: profileData.receiveAllNotifications
                })
            });

            if (res.ok) {
                const updated = await res.json();
                updateUser({
                    name: updated.name,
                    about: updated.about,
                    preferredExams: updated.preferredExams,
                    exams: updated.preferredExams.map((e: any) => e.name || e),
                    examHashtags: updated.examHashtags,
                    receiveAllNotifications: updated.receiveAllNotifications
                });
                alert(t('settings.success'));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerifyMentor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.token) return;

        const fileInput = document.getElementById('mentorDocument') as HTMLInputElement;
        if (!fileInput?.files?.[0]) {
            alert('Please upload a supporting document (ID proof, certificate, etc.)');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('experience', mentorForm.experience);
            formData.append('expertise', mentorForm.expertise);
            formData.append('document', fileInput.files[0]);

            const res = await fetch('http://localhost:5000/api/users/apply-mentor', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                },
                body: formData
            });

            if (res.ok) {
                alert('Mentor application submitted successfully!');
                setVerificationType(null);
                setMentorForm({ experience: '', expertise: '' });
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to submit application');
            }
        } catch (err) {
            console.error(err);
            alert('Error submitting application');
        }
    };

    const handleVerifyAcademy = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.token) return;

        const fileInput = document.getElementById('academyDocument') as HTMLInputElement;
        if (!fileInput?.files?.[0]) {
            alert('Please upload a supporting document (registration certificate, license, etc.)');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('academyName', academyForm.academyName);
            formData.append('location', academyForm.location);
            formData.append('website', academyForm.website);
            formData.append('description', academyForm.description);
            formData.append('document', fileInput.files[0]);

            const res = await fetch('http://localhost:5000/api/users/apply-academy', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                },
                body: formData
            });

            if (res.ok) {
                alert('Academy application submitted successfully!');
                setVerificationType(null);
                setAcademyForm({ academyName: '', location: '', website: '', description: '' });
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to submit application');
            }
        } catch (err) {
            console.error(err);
            alert('Error submitting application');
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto pt-6 px-6 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                <div className="flex-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
                        <div className="p-8 md:p-10 border-b bg-white">
                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t('settings.title')}</h1>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">{t('settings.subtitle')}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[500px]">
                            {/* Tabs Navigation */}
                            <div className="bg-gray-50/50 border-r border-gray-100">
                                <div className="p-4 space-y-2">
                                    <button
                                        onClick={() => setActiveTab('profile')}
                                        className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-white text-blue-700 shadow-md border border-blue-100' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
                                    >
                                        {t('settings.tabs.profile')}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('account')}
                                        className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'account' ? 'bg-white text-blue-700 shadow-md border border-blue-100' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
                                    >
                                        {t('settings.tabs.security')}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('notifications')}
                                        className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'notifications' ? 'bg-white text-blue-700 shadow-md border border-blue-100' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
                                    >
                                        {t('settings.tabs.notifs')}
                                    </button>
                                    {/* Verification Tab only if not verified? Requirements say yes. */}
                                    {(!['mentor', 'academy'].includes(user?.role || '') || user?.role === 'student' || user?.role === 'admin') && (
                                        <button
                                            onClick={() => setActiveTab('verification')}
                                            className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'verification' ? 'bg-white text-violet-700 shadow-md border border-violet-100' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
                                        >
                                            Get Verified
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="p-8 md:p-12 bg-white">
                                {activeTab === 'profile' && (
                                    <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('settings.label.name')}</label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('settings.label.bio')}</label>
                                            <textarea
                                                rows={4}
                                                value={profileData.about}
                                                onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
                                                placeholder={t('settings.bio_placeholder')}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-2xl font-medium transition-all resize-none text-gray-800 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-400">Preferred Exams (1-5)</label>
                                            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto no-scrollbar p-1 border-t border-b border-gray-50 py-3">
                                                {allExams.map(exam => (
                                                    <button
                                                        key={exam._id}
                                                        type="button"
                                                        onClick={() => toggleExam(exam._id)}
                                                        className={`px-3 py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${profileData.preferredExams.includes(exam._id) ? 'bg-blue-700 border-blue-700 text-white shadow-md' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300'}`}
                                                    >
                                                        {exam.name}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase px-1 leading-relaxed">Select up to 5 exams to focus your feed and notifications.</p>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="w-full md:w-auto px-12 py-5 bg-[#1a237e] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                        >
                                            {isSaving ? t('settings.updating') : t('settings.update_button')}
                                        </button>
                                    </form>
                                )}

                                {activeTab === 'account' && (
                                    <div className="space-y-8 animate-in fade-in duration-300">
                                        {/* Password Change Section */}
                                        <div className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100">
                                            <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight mb-2">Change Password</h3>
                                            <p className="text-xs text-blue-700/70 font-bold mb-6 italic leading-relaxed">Update your password to keep your account secure</p>

                                            <form onSubmit={async (e) => {
                                                e.preventDefault();
                                                const formData = new FormData(e.currentTarget);
                                                const currentPassword = formData.get('currentPassword') as string;
                                                const newPassword = formData.get('newPassword') as string;
                                                const confirmPassword = formData.get('confirmPassword') as string;

                                                if (newPassword !== confirmPassword) {
                                                    alert('New passwords do not match!');
                                                    return;
                                                }

                                                if (newPassword.length < 6) {
                                                    alert('Password must be at least 6 characters long');
                                                    return;
                                                }

                                                try {
                                                    const res = await fetch('http://localhost:5000/api/users/change-password', {
                                                        method: 'PUT',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${user?.token}`
                                                        },
                                                        body: JSON.stringify({ currentPassword, newPassword })
                                                    });

                                                    if (res.ok) {
                                                        alert('Password changed successfully!');
                                                        e.currentTarget.reset();
                                                    } else {
                                                        const error = await res.json();
                                                        alert(error.message || 'Failed to change password');
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Error changing password');
                                                }
                                            }} className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Current Password</label>
                                                    <input
                                                        type="password"
                                                        name="currentPassword"
                                                        required
                                                        className="w-full bg-white border-2 border-blue-100 focus:border-blue-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none"
                                                        placeholder="Enter current password"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">New Password</label>
                                                    <input
                                                        type="password"
                                                        name="newPassword"
                                                        required
                                                        minLength={6}
                                                        className="w-full bg-white border-2 border-blue-100 focus:border-blue-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none"
                                                        placeholder="Enter new password (min 6 characters)"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Confirm New Password</label>
                                                    <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        required
                                                        minLength={6}
                                                        className="w-full bg-white border-2 border-blue-100 focus:border-blue-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none"
                                                        placeholder="Re-enter new password"
                                                    />
                                                </div>
                                                <button type="submit" className="px-8 py-3 bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-sm">
                                                    Update Password
                                                </button>
                                            </form>
                                        </div>

                                        {/* Email Change Section */}
                                        <div className="p-8 bg-green-50/50 rounded-[2rem] border border-green-100">
                                            <h3 className="text-sm font-black text-green-900 uppercase tracking-tight mb-2">Change Email</h3>
                                            <p className="text-xs text-green-700/70 font-bold mb-6 italic leading-relaxed">Update your email address</p>

                                            <form onSubmit={async (e) => {
                                                e.preventDefault();
                                                const formData = new FormData(e.currentTarget);
                                                const newEmail = formData.get('newEmail') as string;
                                                const password = formData.get('password') as string;

                                                try {
                                                    const res = await fetch('http://localhost:5000/api/users/change-email', {
                                                        method: 'PUT',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${user?.token}`
                                                        },
                                                        body: JSON.stringify({ newEmail, password })
                                                    });

                                                    if (res.ok) {
                                                        const data = await res.json();
                                                        updateUser({ email: data.email });
                                                        alert('Email changed successfully!');
                                                        e.currentTarget.reset();
                                                    } else {
                                                        const error = await res.json();
                                                        alert(error.message || 'Failed to change email');
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Error changing email');
                                                }
                                            }} className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Current Email</label>
                                                    <input
                                                        type="email"
                                                        value={user?.email || ''}
                                                        disabled
                                                        className="w-full bg-gray-100 border-2 border-gray-200 p-4 rounded-2xl font-bold text-gray-500 outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">New Email</label>
                                                    <input
                                                        type="email"
                                                        name="newEmail"
                                                        required
                                                        className="w-full bg-white border-2 border-green-100 focus:border-green-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none"
                                                        placeholder="Enter new email address"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Confirm Password</label>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        required
                                                        className="w-full bg-white border-2 border-green-100 focus:border-green-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none"
                                                        placeholder="Enter your password to confirm"
                                                    />
                                                </div>
                                                <button type="submit" className="px-8 py-3 bg-green-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-800 transition-all shadow-sm">
                                                    Update Email
                                                </button>
                                            </form>
                                        </div>

                                        {/* Delete Account Section */}
                                        <div className="p-8 bg-black text-white rounded-[2rem] shadow-2xl">
                                            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2">Delete Account</h3>
                                            <p className="text-xs text-gray-400 font-bold mb-6 italic leading-relaxed">
                                                Request account deletion with a 30-day grace period. You can cancel by logging in within 30 days.
                                            </p>
                                            <button
                                                onClick={async () => {
                                                    const confirmed = confirm('Your account will be scheduled for deletion in 30 days. You can cancel anytime by logging in during this period. Continue?');
                                                    if (!confirmed) return;

                                                    const password = prompt('Please enter your password to confirm:');
                                                    if (!password) return;

                                                    try {
                                                        const res = await fetch('http://localhost:5000/api/users/delete-account', {
                                                            method: 'DELETE',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${user?.token}`
                                                            },
                                                            body: JSON.stringify({ password })
                                                        });

                                                        if (res.ok) {
                                                            const data = await res.json();
                                                            const deletionDate = new Date(data.scheduledDeletionDate).toLocaleDateString();
                                                            alert(`Account deletion scheduled for ${deletionDate}. You can cancel by logging in anytime before this date.`);
                                                            logout();
                                                        } else {
                                                            const error = await res.json();
                                                            alert(error.message || 'Failed to schedule account deletion');
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('Error scheduling account deletion');
                                                    }
                                                }}
                                                className="px-8 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg"
                                            >
                                                Delete My Account
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 mb-6">
                                            <h3 className="text-sm font-black text-blue-900 mb-2">Notification Preferences</h3>
                                            <p className="text-xs text-blue-700">Customize which notifications you want to receive</p>
                                        </div>

                                        {/* Targeted Exam Alerts */}
                                        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-gray-200 transition-all group">
                                            <div>
                                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-700 transition-colors">Targeted Exam Alerts</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Only receive notifications for your preferred exams</p>
                                            </div>
                                            <div
                                                onClick={async () => {
                                                    const newValue = !profileData.receiveAllNotifications;
                                                    setProfileData({ ...profileData, receiveAllNotifications: newValue });
                                                    try {
                                                        await fetch('http://localhost:5000/api/users/profile', {
                                                            method: 'PUT',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${user?.token}`
                                                            },
                                                            body: JSON.stringify({ receiveAllNotifications: newValue })
                                                        });
                                                    } catch (err) { console.error(err); }
                                                }}
                                                className={`w-14 h-7 rounded-full relative p-1 cursor-pointer shadow-inner transition-colors ${!profileData.receiveAllNotifications ? 'bg-blue-700' : 'bg-gray-300'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all ${!profileData.receiveAllNotifications ? 'ml-auto' : 'ml-0'}`}></div>
                                            </div>
                                        </div>

                                        {/* Individual Notification Preferences */}
                                        {[
                                            { title: 'Email Digest', desc: 'Receive daily summary emails', key: 'emailDigest' as const },
                                            { title: 'Post Likes', desc: 'When someone likes your post', key: 'postLikes' as const },
                                            { title: 'Post Comments', desc: 'When someone comments on your post', key: 'postComments' as const },
                                            { title: 'New Followers', desc: 'When someone follows you', key: 'newFollowers' as const },
                                            { title: 'Connection Requests', desc: 'When you receive connection requests', key: 'connectionRequests' as const },
                                            { title: 'Mentions', desc: 'When someone mentions you', key: 'mentions' as const },
                                            { title: 'Messages', desc: 'When you receive new messages', key: 'messages' as const }
                                        ].map((n) => (
                                            <div key={n.key} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-gray-200 transition-all group">
                                                <div>
                                                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-700 transition-colors">{n.title}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{n.desc}</p>
                                                </div>
                                                <div
                                                    onClick={async () => {
                                                        const newPrefs = { ...notificationPrefs, [n.key]: !notificationPrefs[n.key] };
                                                        setNotificationPrefs(newPrefs);
                                                        try {
                                                            const res = await fetch('http://localhost:5000/api/users/notification-preferences', {
                                                                method: 'PUT',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    'Authorization': `Bearer ${user?.token}`
                                                                },
                                                                body: JSON.stringify({ notificationPreferences: newPrefs })
                                                            });
                                                            if (res.ok) {
                                                                // Show brief success indicator
                                                                console.log('Notification preferences updated');
                                                            }
                                                        } catch (err) { console.error(err); }
                                                    }}
                                                    className={`w-14 h-7 rounded-full relative p-1 cursor-pointer shadow-inner transition-colors ${notificationPrefs[n.key] ? 'bg-blue-700' : 'bg-gray-300'}`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all ${notificationPrefs[n.key] ? 'ml-auto' : 'ml-0'}`}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'verification' && (
                                    <div className="animate-in fade-in duration-300 space-y-6">
                                        {!verificationType ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <button
                                                    onClick={() => setVerificationType('mentor')}
                                                    className="p-8 rounded-[2rem] border-2 border-gray-100 hover:border-violet-600 bg-white hover:bg-violet-50 transition-all text-left group"
                                                >
                                                    <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">🎓</span>
                                                    <h3 className="text-xl font-black text-gray-900 mb-2">Verify as Mentor</h3>
                                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">Share your expertise and guide aspirants. Get a verified badge and mentorship tools.</p>
                                                </button>

                                                <button
                                                    onClick={() => setVerificationType('academy')}
                                                    className="p-8 rounded-[2rem] border-2 border-gray-100 hover:border-violet-600 bg-white hover:bg-violet-50 transition-all text-left group"
                                                >
                                                    <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">🏛️</span>
                                                    <h3 className="text-xl font-black text-gray-900 mb-2">Verify as Academy</h3>
                                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">Register your institution. Publish courses, updates, and manage student batches.</p>
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <button onClick={() => setVerificationType(null)} className="text-xs font-bold text-gray-400 hover:text-black mb-6 uppercase tracking-widest flex items-center gap-2">
                                                    ← Back
                                                </button>

                                                {verificationType === 'mentor' && (
                                                    <form onSubmit={handleVerifyMentor} className="space-y-6">
                                                        <div className="p-6 bg-violet-50 rounded-2xl border border-violet-100 mb-6">
                                                            <h3 className="text-lg font-black text-violet-900 mb-2">Mentor Application</h3>
                                                            <p className="text-xs text-violet-700">Submit your details for review. Pending approval.</p>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Experience (Years/Details)</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={mentorForm.experience}
                                                                onChange={e => setMentorForm({ ...mentorForm, experience: e.target.value })}
                                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-violet-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none"
                                                                placeholder="e.g. 5 Years teaching FDA/SDA"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expertise (Comma separated)</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={mentorForm.expertise}
                                                                onChange={e => setMentorForm({ ...mentorForm, expertise: e.target.value })}
                                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-violet-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none"
                                                                placeholder="e.g. History, Geography, Polity"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                                                Supporting Document * <span className="text-red-500">(Required)</span>
                                                            </label>
                                                            <p className="text-[9px] text-gray-500 mb-2 ml-1">Upload ID proof, teaching certificate, or relevant credentials (PDF, JPG, PNG - Max 5MB)</p>
                                                            <input
                                                                type="file"
                                                                id="mentorDocument"
                                                                required
                                                                accept=".pdf,.jpg,.jpeg,.png"
                                                                className="w-full bg-gray-50 border-2 border-dashed border-violet-300 focus:border-violet-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200"
                                                            />
                                                        </div>

                                                        <button
                                                            type="submit"
                                                            className="w-full px-12 py-5 bg-violet-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                                                        >
                                                            Submit Application
                                                        </button>
                                                    </form>
                                                )}

                                                {verificationType === 'academy' && (
                                                    <form onSubmit={handleVerifyAcademy} className="space-y-6">
                                                        <div className="p-6 bg-violet-50 rounded-2xl border border-violet-100 mb-6">
                                                            <h3 className="text-lg font-black text-violet-900 mb-2">Academy Registration</h3>
                                                            <p className="text-xs text-violet-700">Register your institute for official verification.</p>
                                                        </div>

                                                        <div className="grid md:grid-cols-2 gap-6">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academy Name</label>
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    value={academyForm.academyName}
                                                                    onChange={e => setAcademyForm({ ...academyForm, academyName: e.target.value })}
                                                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-violet-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location</label>
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    value={academyForm.location}
                                                                    onChange={e => setAcademyForm({ ...academyForm, location: e.target.value })}
                                                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-violet-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Website (Optional)</label>
                                                            <input
                                                                type="url"
                                                                value={academyForm.website}
                                                                onChange={e => setAcademyForm({ ...academyForm, website: e.target.value })}
                                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-violet-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none"
                                                                placeholder="https://"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                                                            <textarea
                                                                rows={4}
                                                                value={academyForm.description}
                                                                onChange={e => setAcademyForm({ ...academyForm, description: e.target.value })}
                                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-violet-600 p-4 rounded-2xl font-medium transition-all resize-none text-gray-800 outline-none"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                                                Supporting Document * <span className="text-red-500">(Required)</span>
                                                            </label>
                                                            <p className="text-[9px] text-gray-500 mb-2 ml-1">Upload registration certificate, license, or official documents (PDF, JPG, PNG - Max 5MB)</p>
                                                            <input
                                                                type="file"
                                                                id="academyDocument"
                                                                required
                                                                accept=".pdf,.jpg,.jpeg,.png"
                                                                className="w-full bg-gray-50 border-2 border-dashed border-violet-300 focus:border-violet-600 p-4 rounded-2xl font-bold transition-all text-gray-900 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200"
                                                            />
                                                        </div>

                                                        <button
                                                            type="submit"
                                                            className="w-full px-12 py-5 bg-violet-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                                                        >
                                                            Submit Registration
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
                                        )}
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
                            {t('settings.logout')}
                        </button>
                    </div>
                </div >
            </main >
        </div >
    );
}

