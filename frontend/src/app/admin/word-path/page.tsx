'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiCheckCircle, FiClock, FiUsers, FiCalendar, FiPlay, FiRotateCcw } from 'react-icons/fi';

export default function WordPathAdminPage() {
    const { user } = useAuth();
    const [candidates, setCandidates] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState(false);
    const [reseting, setReseting] = useState(false);

    useEffect(() => {
        if (user?.token) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch candidates
            const candRes = await fetch('http://localhost:5000/api/word-path/candidates', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const candData = await candRes.json();
            if (candRes.ok) setCandidates(candData.candidates || []);

            // Fetch stats
            const statsRes = await fetch('http://localhost:5000/api/word-path/stats', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const statsData = await statsRes.ok ? await statsRes.json() : null;
            setStats(statsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (wordId: string) => {
        if (!confirm('Are you sure you want to activate this word for today?')) return;
        setSelecting(true);
        try {
            const res = await fetch('http://localhost:5000/api/word-path/select', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ wordId })
            });
            if (res.ok) {
                alert('Puzzle activated successfully!');
                fetchData();
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to activate');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSelecting(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('Reset today\'s puzzle? All attempts and progress will be deleted.')) return;
        setReseting(true);
        try {
            const res = await fetch('http://localhost:5000/api/word-path/daily', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                alert('Puzzle reset successfully!');
                fetchData();
            } else {
                alert('Failed to reset');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setReseting(false);
        }
    };

    if (loading) return <div className="p-10 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Word Path Data...</div>;

    const isActive = stats?.daily?.status === 'active';

    return (
        <div className="max-w-6xl mx-auto space-y-12 p-6 pb-20">
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Word Path Admin</h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Daily Content Selection & Optimization</p>
                </div>
                <div className="flex items-center gap-2 bg-white border px-4 py-2 rounded-xl text-xs font-bold text-gray-500 shadow-sm">
                    <FiCalendar /> {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </header>

            {isActive ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4">
                            <FiUsers className="text-emerald-500 text-3xl" />
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attempts</p>
                                <h2 className="text-4xl font-black text-gray-900">{stats?.totalAttempts || 0}</h2>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4">
                            <FiCheckCircle className="text-blue-500 text-3xl" />
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Success Rate</p>
                                <h2 className="text-4xl font-black text-gray-900">{stats?.successRate || 0}%</h2>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4">
                            <FiClock className="text-amber-500 text-3xl" />
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg Time</p>
                                <h2 className="text-4xl font-black text-gray-900">{stats?.avgTime || 0}s</h2>
                            </div>
                        </div>
                        <div className="bg-emerald-900 text-white p-8 rounded-[2.5rem] shadow-lg flex flex-col justify-between relative overflow-hidden group">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Active Word</p>
                            <h2 className="text-2xl font-black uppercase truncate pr-4">{stats?.daily?.selectedWord?.word}</h2>

                            <button
                                disabled={reseting}
                                onClick={handleReset}
                                className="mt-4 py-2 border border-white/20 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                                <FiRotateCcw size={8} /> {reseting ? 'Reseting...' : 'Reset Puzzle'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] p-10 border shadow-2xl space-y-8">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Generated Grid Preview</h3>
                        <div className="grid grid-cols-4 gap-3 max-w-xs">
                            {stats?.daily?.grid?.map((cell: any, i: number) => (
                                <div key={i} className="aspect-square border-2 border-gray-100 rounded-2xl flex items-center justify-center font-black text-xl text-gray-800 bg-gray-50 uppercase shadow-sm">
                                    {cell.letter}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] text-center space-y-4">
                        <h2 className="text-2xl font-black text-amber-900 uppercase tracking-tight">Daily Action Required</h2>
                        <p className="text-amber-700 font-bold max-w-lg mx-auto leading-relaxed">
                            A new puzzle needs to be generated for today. Please select the most appropriate word from the generated candidates below.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        {candidates.map((cand: any) => (
                            <div
                                key={cand._id}
                                className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-between space-y-6 hover:shadow-xl transition-all group"
                            >
                                <div className="space-y-4">
                                    <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                        {cand.category}
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase group-hover:text-amber-600 transition-colors">{cand.word}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 leading-relaxed italic line-clamp-3">
                                        {cand.explanation}
                                    </p>
                                </div>
                                <button
                                    disabled={selecting}
                                    onClick={() => handleSelect(cand._id)}
                                    className="w-full py-3 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                                >
                                    <FiPlay size={10} /> Select
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
