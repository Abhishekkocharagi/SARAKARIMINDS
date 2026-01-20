'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user && user.role === 'admin') {
            router.push('/admin/dashboard');
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                if (data.role === 'admin') {
                    login(data);
                    router.push('/admin/dashboard');
                } else {
                    setError('Access denied. You do not have administrator privileges.');
                }
            } else {
                setError(data.message || 'Invalid credentials.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
            <div className="max-w-md w-full bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-2xl bg-blue-500/10 text-blue-500 text-4xl mb-4">
                        🛡️
                    </div>
                    <h1 className="text-3xl font-black text-white">Admin Access</h1>
                    <p className="text-gray-400 mt-2">Secure entry for NammaSarkaari administrators</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-bold mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                            placeholder="admin@nammasarkaari.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition shadow-lg shadow-blue-500/20 mt-4 disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Sign In to Panel'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-500 hover:text-white text-sm font-bold transition"
                    >
                        ← Back to Platform
                    </button>
                </div>
            </div>
        </div>
    );
}
