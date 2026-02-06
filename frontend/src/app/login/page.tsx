'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, user, loading } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/feed');
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                login(data);

                // Show deletion cancellation message if applicable
                if (data.deletionCancelled) {
                    alert('✅ Welcome back! Your account deletion has been cancelled. Your account is now active again.');
                }

                router.push('/feed');
            } else {
                setError(data.message || t('auth.invalid_login'));
            }
        } catch (err) {
            setError(t('auth.conn_failed'));
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/30 blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/30 blur-3xl opacity-70"></div>
            </div>

            <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 md:p-12 border border-gray-100 z-10 relative">
                <div className="text-center mb-10">
                    <img src="/logo_full.png" alt="SarkariMinds" className="h-16 mx-auto mb-4 object-contain" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{t('auth.login_portal')}</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-xs font-bold text-center border border-red-100 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('auth.email_label')}</label>
                        <div className="relative group">
                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a237e] transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 pl-11 pr-4 py-4 rounded-2xl focus:outline-none focus:border-[#1a237e] focus:bg-white transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                placeholder={t('auth.id_placeholder')}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('auth.pass_label')}</label>
                            <Link href="/forgot-password" title="Forgot Password" className="text-[10px] font-black text-[#1a237e] uppercase tracking-widest hover:underline underline-offset-4">{t('auth.forgot_link')}</Link>
                        </div>
                        <div className="relative group">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a237e] transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 pl-11 pr-4 py-4 rounded-2xl focus:outline-none focus:border-[#1a237e] focus:bg-white transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                placeholder={t('auth.password_placeholder')}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1a237e] hover:bg-black text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-900/20 uppercase tracking-widest flex items-center justify-center gap-2 group mt-4 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? t('auth.entering') : (
                            <>
                                {t('auth.signin_btn')}
                                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-12 pt-10 border-t border-gray-50 text-center">
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-tight">
                        {t('auth.new_community')}{' '}
                        <Link href="/signup" title="Create Account" className="text-[#1a237e] font-black hover:underline uppercase tracking-widest ml-1 transition-colors">{t('nav.join_now')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
