'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { FiCheck, FiInfo, FiArrowRight, FiRotateCcw, FiAward, FiAlertCircle, FiHelpCircle, FiX, FiArrowLeft } from 'react-icons/fi';

interface Cell {
    letter: string;
    r: number;
    c: number;
    isCheckpoint?: boolean;
    checkpointIndex?: number;
}

interface Puzzle {
    _id: string;
    grid: Cell[];
    targetWord: string;
    category: string;
    difficulty: string;
    explanation: string;
    attempted: boolean;
    attemptStatus?: 'correct' | 'wrong';
    userPath?: { r: number; c: number }[];
    correctPath?: { r: number; c: number }[];
}

export default function WordPathGamePage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [loading, setLoading] = useState(true);
    const [path, setPath] = useState<{ r: number; c: number }[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [result, setResult] = useState<{ isCorrect: boolean; correctPath: { r: number; c: number }[] } | null>(null);
    const [showModal, setShowModal] = useState(false);

    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user?.token) {
            fetchPuzzle();
        }
    }, [user]);

    const fetchPuzzle = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/word-path/today', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setPuzzle(data);
                if (data.attempted && data.userPath) {
                    setPath(data.userPath);
                }
                setStartTime(Date.now());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addCellToPath = (r: number, c: number) => {
        if (puzzle?.attempted || result) return;

        const cp1 = puzzle?.grid.find(g => g.checkpointIndex === 1);

        if (path.length === 0) {
            if (cp1 && cp1.r === r && cp1.c === c) {
                setPath([{ r, c }]);
            } else if (!cp1) {
                setPath([{ r, c }]);
            }
            return;
        }

        const last = path[path.length - 1];
        if (last.r === r && last.c === c) return;

        const isNeighbor = Math.abs(last.r - r) + Math.abs(last.c - c) === 1;
        if (!isNeighbor) return;

        const cellInfo = puzzle?.grid.find(g => g.r === r && g.c === c);
        if (cellInfo && cellInfo.isCheckpoint) {
            const currentCheckpointsReached = puzzle?.grid?.filter(g => g.isCheckpoint && path.some(p => p.r === g.r && p.c === g.c))?.length || 0;
            const nextExpectedIdx = currentCheckpointsReached + 1;
            if (cellInfo.checkpointIndex !== nextExpectedIdx) {
                return;
            }
        }

        const existingIdx = path.findIndex(p => p.r === r && p.c === c);
        if (existingIdx !== -1) {
            if (existingIdx === path.length - 2) {
                setPath(path.slice(0, -1));
            }
            return;
        }

        setPath([...path, { r, c }]);
    };

    const handleUndo = () => {
        if (puzzle?.attempted || result || path.length === 0) return;
        setPath(prev => prev.slice(0, -1));
    };

    const handleSubmit = async () => {
        if (path.length !== 16 || !puzzle) return;
        setSubmitting(true);
        const duration = Math.floor((Date.now() - startTime) / 1000);
        try {
            const res = await fetch('http://localhost:5000/api/word-path/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ dailyId: puzzle._id, userPath: path, duration })
            });
            const data = await res.json();
            if (res.ok) {
                setResult(data);
                setShowModal(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-black animate-pulse text-gray-400 uppercase tracking-widest">Generating Your Daily Word Path...</div>;
    if (!puzzle) return <div className="p-20 text-center font-black text-amber-600 uppercase">Today's challenge is being prepared by the Mentor. Check back shortly!</div>;

    const cellSize = 80;
    const gap = 12;
    const padding = 20;

    const getCoord = (val: number) => val * (cellSize + gap) + cellSize / 2 + padding;

    const targetWord = puzzle.targetWord;
    const legend = targetWord.split('').map((letter, i) => ({ letter, index: i + 1 }));
    const isSolved = puzzle.attempted || (result && result.isCorrect);

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20 px-4 select-none"
            onMouseUp={() => setIsDragging(false)}
            onTouchEnd={() => setIsDragging(false)}
        >
            {/* COMPONENT 1: OUT BOX (LEGEND) */}
            <header className="bg-white p-6 md:p-8 rounded-[3rem] border shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center md:text-left">
                        <Link href="/games" className="inline-flex items-center gap-2 text-gray-400 font-bold mb-4 hover:bg-gray-50 px-3 py-1 rounded-full text-xs uppercase tracking-widest transition-colors mb-2">
                            <FiArrowLeft /> {t('games.back_games')}
                        </Link>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Word Path (ಪದ ಹಾದಿ)</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{puzzle.category} • {puzzle.difficulty}</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-[2rem] border border-dashed border-gray-200">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Sequential Legend (Out Box)</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {legend.map((item) => (
                            <div key={item.index} className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-white rounded-2xl border-2 border-gray-100 flex items-center justify-center shadow-sm relative group transform transition-all hover:scale-110">
                                    <span className="text-lg font-black text-gray-900">{item.letter}</span>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-lg">
                                        {item.index}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {/* COMPONENT 2: INTERACTIVE GRID (INSIDE BOX) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                <div className="lg:col-span-2 flex flex-col items-center space-y-6">
                    <div
                        className="relative bg-white p-5 rounded-[4rem] border-8 border-gray-50 shadow-2xl"
                        style={{ width: 4 * (cellSize + gap) + 40, height: 4 * (cellSize + gap) + 40 }}
                    >
                        {/* THE ZIP PATH (SVG) */}
                        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                            {path.length > 1 && (
                                <path
                                    d={`M ${getCoord(path[0].c)} ${getCoord(path[0].r)} ` + path.slice(1).map(p => `L ${getCoord(p.c)} ${getCoord(p.r)}`).join(' ')}
                                    fill="none"
                                    stroke={isSolved ? '#10b981' : '#3b82f6'}
                                    strokeWidth="48"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="transition-all duration-300 opacity-90"
                                />
                            )}
                        </svg>

                        {/* THE GRID NODES */}
                        <div className="grid grid-cols-4 gap-[12px] relative z-10">
                            {[0, 1, 2, 3].map(r => (
                                [0, 1, 2, 3].map(c => {
                                    const cell = puzzle.grid.find(g => g.r === r && g.c === c)!;
                                    const pathIdx = path.findIndex(p => p.r === r && p.c === c);
                                    const isSelected = pathIdx !== -1;

                                    return (
                                        <div
                                            key={`${r}-${c}`}
                                            onMouseDown={() => { setIsDragging(true); addCellToPath(r, c); }}
                                            onMouseEnter={() => { if (isDragging) addCellToPath(r, c); }}
                                            className={`
                                                w-[80px] h-[80px] flex items-center justify-center rounded-[2rem] transition-all cursor-pointer relative
                                                ${isSelected ? 'scale-90' : 'bg-transparent border-2 border-dashed border-gray-100 hover:bg-gray-50'}
                                            `}
                                        >
                                            {cell.isCheckpoint ? (
                                                <div className={`
                                                    w-12 h-12 rounded-full flex items-center justify-center ring-4 transition-all z-20
                                                    ${isSelected ? 'bg-white ring-blue-400 shadow-xl' : 'bg-gray-900 ring-gray-100'}
                                                `}>
                                                    <span className={`font-black text-xl ${isSelected ? 'text-blue-600' : 'text-white'}`}>
                                                        {cell.checkpointIndex}
                                                    </span>
                                                </div>
                                            ) : (
                                                isSelected ? (
                                                    <div className="w-4 h-4 bg-white/50 rounded-full shadow-inner" />
                                                ) : (
                                                    <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                                )
                                            )}
                                        </div>
                                    );
                                })
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 font-black text-[9px] uppercase tracking-widest">
                        <FiInfo /> Path Length: {path.length} / 16
                    </div>
                </div>

                <div className="space-y-8">
                    {!isSolved ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border-2 border-blue-100 p-8 rounded-[2.5rem] space-y-4 shadow-sm">
                                <h4 className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-widest">
                                    <FiInfo /> Instructions
                                </h4>
                                <ul className="text-blue-800 font-bold leading-relaxed text-[11px] space-y-2 list-disc pl-4">
                                    <li>Follow the sequence: <strong>1 → 2 → 3...</strong></li>
                                    <li>Cover <strong>ALL 16 cells</strong> to win.</li>
                                    <li>Lines must <strong>never overlap</strong>.</li>
                                </ul>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || path.length < 16}
                                className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:bg-gray-100 disabled:text-gray-300"
                            >
                                {submitting ? 'Checking...' : 'Submit Path'} <FiArrowRight />
                            </button>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleUndo}
                                    disabled={path.length === 0}
                                    className="py-4 bg-white text-blue-600 border border-blue-100 rounded-[1.5rem] font-black uppercase text-[9px] tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <FiRotateCcw className="rotate-180" /> Undo Move
                                </button>
                                <button
                                    onClick={() => setPath([])}
                                    className="py-4 bg-white text-gray-400 border rounded-[1.5rem] font-black uppercase text-[9px] tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <FiRotateCcw /> Reset Grid
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full py-10 bg-emerald-600 text-white rounded-[3rem] font-black uppercase text-xs tracking-widest shadow-2xl animate-pulse flex flex-col items-center gap-4"
                        >
                            <FiAward size={40} />
                            View Deciphered Word
                        </button>
                    )}
                </div>
            </div>

            {/* RESULT MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white max-w-md w-full rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.2)] relative animate-in zoom-in slide-in-from-bottom-10 duration-500">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-8 right-8 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                        >
                            <FiX size={20} />
                        </button>

                        <div className="p-12 space-y-10">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deciphered Word</p>
                                <div className="min-h-[80px] flex items-center">
                                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-none break-words overflow-hidden w-full uppercase tracking-tighter">
                                        {targetWord}
                                    </h2>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-100" />

                            <div className="space-y-6">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Meaning & Insight</p>
                                <p className="text-xl md:text-2xl font-bold text-gray-700 leading-snug whitespace-pre-wrap">
                                    {puzzle.explanation}
                                </p>
                            </div>

                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all"
                            >
                                Close Definition
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
