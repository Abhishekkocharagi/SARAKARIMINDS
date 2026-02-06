'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { FiArrowLeft, FiCheck, FiAward, FiBookOpen, FiActivity } from 'react-icons/fi';

export default function MentorRegister() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        experience: '',
        expertise: [] as string[]
    });
    const [currentExpertise, setCurrentExpertise] = useState('');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/register/mentor');
        }
    }, [user, authLoading, router]);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/users/apply-mentor', {
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
            alert(t('auth.reg_fail'));
        } finally {
            setLoading(false);
        }
    };

    const addExpertise = () => {
        if (currentExpertise && !formData.expertise.includes(currentExpertise)) {
            setFormData({ ...formData, expertise: [...formData.expertise, currentExpertise] });
            setCurrentExpertise('');
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center">{t('auth.authenticating')}</div>;

    if (success) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-12 border border-green-100">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiCheck size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">{t('partner.academy.success_title')}</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        {t('partner.mentor.success_desc')}
                    </p>
                    <p className="text-xs text-gray-400 mt-8 font-bold uppercase tracking-widest animate-pulse">{t('auth.redirecting')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
            <div className="max-w-5xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">

                {/* Visual Sidebar */}
                <div className="md:w-5/12 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-12 text-white flex flex-col justify-between relative">
                    <div className="relative z-10">
                        <Link href="/feed" className="inline-flex items-center gap-2 text-indigo-200 font-bold text-sm mb-12 hover:text-white transition-colors">
                            <FiArrowLeft /> {t('news.go_back')}
                        </Link>
                        <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">{t('partner.mentor.program')}</div>
                        <h2 className="text-5xl font-black mb-6 leading-[1.1]">{t('partner.mentor.hero')}</h2>
                        <ul className="space-y-4">
                            {[
                                { icon: <FiAward />, text: t('partner.mentor.benefit1') },
                                { icon: <FiBookOpen />, text: t('partner.mentor.benefit2') },
                                { icon: <FiActivity />, text: t('partner.mentor.benefit3') }
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100/80 font-semibold">
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
                        <h3 className="text-3xl font-black text-gray-900 mb-2">{t('partner.mentor.title')}</h3>
                        <p className="text-gray-500 font-medium">{t('auth.login_greeting')} <span className="text-indigo-600 font-bold">{user?.name}</span>. {t('partner.mentor.desc')}</p>
                    </div>

                    <form onSubmit={handleApply} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{t('partner.mentor.label.exp')}</label>
                            <textarea
                                required
                                value={formData.experience}
                                onChange={e => setFormData({ ...formData, experience: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-semibold text-gray-700 focus:bg-white focus:border-indigo-600 outline-none transition-all min-h-[120px]"
                                placeholder={t('partner.mentor.ph.exp')}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{t('partner.mentor.label.expertise')}</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={currentExpertise}
                                    onChange={e => setCurrentExpertise(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-semibold text-gray-700 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                                    placeholder={t('partner.mentor.ph.expertise')}
                                />
                                <button
                                    type="button"
                                    onClick={addExpertise}
                                    className="bg-indigo-600 text-white px-6 rounded-2xl font-black hover:bg-black transition-colors"
                                >
                                    {t('partner.mentor.add_btn')}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.expertise.map((item, i) => (
                                    <div key={i} className="bg-indigo-50 text-indigo-700 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 border border-indigo-100">
                                        {item}
                                        <button type="button" onClick={() => setFormData({ ...formData, expertise: formData.expertise.filter((_, idx) => idx !== i) })} className="hover:text-red-500">×</button>
                                    </div>
                                ))}
                                {formData.expertise.length === 0 && <p className="text-xs text-gray-400 italic py-2">{t('partner.mentor.no_expertise')}</p>}
                            </div>
                        </div>

                        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                {t('partner.mentor.note')}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || formData.expertise.length === 0}
                            className="w-full bg-gradient-to-r from-indigo-700 to-blue-800 hover:from-black hover:to-black text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? t('partner.submitting') : t('partner.submit')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

