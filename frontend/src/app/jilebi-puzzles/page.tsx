'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { FiCheckCircle, FiInfo, FiChevronRight, FiZap, FiX, FiArrowLeft } from 'react-icons/fi';

interface Jilebi {
    _id: string;
    puzzleType: 'sequence' | 'pattern' | 'word_connect' | 'logic_grid' | 'visual';
    question: string;
    options: any;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    isActive: boolean;
    attempted: boolean;
    attemptStatus?: 'correct' | 'wrong' | null;
    userAnswer?: any;
    explanation: string;
    correctAnswer: any;
}

export default function JilebiPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [puzzles, setPuzzles] = useState<Jilebi[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userInput, setUserInput] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (user?.token) {
            fetchTodayJilebi();
        }
    }, [user]);

    const fetchTodayJilebi = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/jilebi/today', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setPuzzles(data);
                if (data.length > 0) initInput(data[0]);
            } else {
                setErrorMsg(data.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const initInput = (puzzle: Jilebi) => {
        if (!puzzle) return;
        if (puzzle.puzzleType === 'word_connect') {
            setUserInput([]);
        } else if (puzzle.puzzleType === 'sequence') {
            // Shuffle items for the user if not already shuffled from options
            const items = [...puzzle.options].sort(() => Math.random() - 0.5);
            setUserInput(items);
        }
    };

    const handleWordLetterClick = (letter: string, idx: number) => {
        if (userInput.includes(idx)) {
            setUserInput(userInput.filter((i: number) => i !== idx));
        } else {
            setUserInput([...userInput, idx]);
        }
    };

    const handleSubmit = async () => {
        const puzzle = puzzles[activeIdx];
        if (!puzzle) return;

        let finalAnswer: any = userInput;

        if (puzzle.puzzleType === 'word_connect') {
            finalAnswer = userInput.map((i: number) => puzzle.options[i]).join('');
        }

        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/api/jilebi/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({
                    puzzleId: puzzle._id,
                    userAnswer: finalAnswer
                })
            });
            const data = await res.json();
            if (res.ok) {
                const newPuzzles = [...puzzles];
                newPuzzles[activeIdx] = {
                    ...puzzle,
                    attempted: true,
                    attemptStatus: data.isCorrect ? 'correct' : 'wrong',
                    userAnswer: finalAnswer,
                    explanation: data.explanation,
                    correctAnswer: data.correctAnswer
                };
                setPuzzles(newPuzzles);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" /></div>;

    if (puzzles.length === 0) {
        return (
            <div className="max-w-xl mx-auto mt-20 text-center space-y-6 px-4">
                <div className="text-8xl">🧩</div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{errorMsg || t('jilebi.not_ready')}</h2>
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 italic text-amber-900 font-bold shadow-sm">
                    "ಜ್ಞಾನಕ್ಕಿಂತ ದೊಡ್ಡ ಶಕ್ತಿ ಇನ್ನಾವುದೂ ಇಲ್ಲ"
                </div>
            </div>
        );
    }

    const currentPuzzle = puzzles[activeIdx];

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
            <header className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 shadow-sm flex items-center justify-between">
                <div>
                    <Link href="/games" className="inline-flex items-center gap-2 text-amber-600 font-bold mb-4 hover:bg-amber-100 px-3 py-1 rounded-full text-xs uppercase tracking-widest transition-colors">
                        <FiArrowLeft /> {t('games.back_games')}
                    </Link>
                    <h1 className="text-3xl font-black text-amber-900 uppercase tracking-tight">{t('jilebi.title')}</h1>
                    <p className="text-amber-700 font-black text-[10px] uppercase tracking-[0.2em] mt-1">{t('jilebi.subtitle')}</p>
                </div>
                {puzzles.length > 1 && (
                    <div className="flex gap-2">
                        {puzzles.map((p, i) => (
                            <button
                                key={p._id}
                                onClick={() => { setActiveIdx(i); initInput(p); }}
                                className={`w-10 h-10 rounded-full font-black text-xs transition-all ${activeIdx === i ? 'bg-amber-600 text-white shadow-lg' : 'bg-white border border-amber-100 text-amber-600'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            <div className="bg-white rounded-[3rem] border shadow-2xl overflow-hidden relative">
                <div className={`absolute top-0 right-0 px-8 py-2 rounded-bl-3xl font-black text-[10px] text-white uppercase tracking-[0.2em] ${currentPuzzle.difficulty === 'Hard' ? 'bg-red-600' : 'bg-amber-600'}`}>
                    {currentPuzzle.difficulty}
                </div>

                <div className="p-10 md:p-14 space-y-12">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <FiZap className="text-amber-500" />
                            <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">
                                {t('jilebi.daily_challenge')}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 leading-relaxed">
                            {currentPuzzle.question}
                        </h2>
                    </div>

                    {!currentPuzzle.attempted ? (
                        <div className="space-y-10 animate-in slide-in-from-bottom-4">
                            {currentPuzzle.puzzleType === 'word_connect' && (
                                <div className="space-y-8">
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {currentPuzzle.options?.map((letter: string, i: number) => (
                                            <button
                                                key={i}
                                                onClick={() => handleWordLetterClick(letter, i)}
                                                className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black transition-all border-b-4 ${userInput.includes(i) ? 'bg-amber-600 border-amber-800 text-white -translate-y-1' : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'}`}
                                            >
                                                {letter}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-3xl border border-dashed flex items-center justify-center min-h-[100px] shadow-inner">
                                        <div className="text-3xl font-black tracking-[0.5em] text-amber-900">
                                            {userInput.map((i: number) => currentPuzzle.options[i]).join('')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentPuzzle.puzzleType === 'sequence' && (
                                <div className="space-y-8">
                                    <div className="flex flex-wrap gap-3 justify-center">
                                        {userInput?.map((item: string, i: number) => (
                                            <div
                                                key={i}
                                                draggable
                                                onDragStart={(e) => e.dataTransfer.setData('idx', i.toString())}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    const from = parseInt(e.dataTransfer.getData('idx'));
                                                    const newSeq = [...userInput];
                                                    const [moved] = newSeq.splice(from, 1);
                                                    newSeq.splice(i, 0, moved);
                                                    setUserInput(newSeq);
                                                }}
                                                className="bg-white border-2 border-amber-100 px-6 py-4 rounded-2xl font-black text-amber-900 cursor-move hover:shadow-lg transition-all active:scale-95 shadow-sm"
                                            >
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 py-2 rounded-full mx-auto max-w-xs border">ಕ್ರಮಬದ್ಧವಾಗಿ ಜೋಡಿಸಿ (Drag to Order)</p>
                                </div>
                            )}

                            <div className="flex justify-center">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || (currentPuzzle.puzzleType === 'word_connect' && userInput.length === 0)}
                                    className="px-14 py-5 bg-gray-900 text-white rounded-full font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center gap-3 disabled:grayscale disabled:opacity-50 hover:scale-105 active:scale-95"
                                >
                                    {submitting ? 'Checking...' : t('jilebi.check')}
                                    {!submitting && <FiChevronRight className="stroke-[3px]" />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10 animate-in zoom-in duration-500">
                            <div className={`p-10 rounded-[2.5rem] border-2 flex flex-col items-center text-center space-y-4 ${currentPuzzle.attemptStatus === 'correct' ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl ${currentPuzzle.attemptStatus === 'correct' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                    {currentPuzzle.attemptStatus === 'correct' ? <FiCheckCircle /> : <FiX />}
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                                    {currentPuzzle.attemptStatus === 'correct' ? t('jilebi.correct') : t('jilebi.wrong')}
                                </h3>
                                {currentPuzzle.attemptStatus === 'wrong' && (
                                    <p className="text-amber-900 font-black text-lg">ಸರಿಯಾದ ಉತ್ತರ: <span className="bg-amber-600 text-white px-4 py-1 rounded-xl ml-2 shadow-sm">{Array.isArray(currentPuzzle.correctAnswer) ? currentPuzzle.correctAnswer.join(' → ') : currentPuzzle.correctAnswer}</span></p>
                                )}
                            </div>

                            <div className="bg-amber-50/30 p-10 rounded-[2.5rem] border border-amber-100 space-y-6">
                                <div className="flex items-center gap-3 text-amber-900">
                                    <FiInfo size={20} className="stroke-[2.5px]" />
                                    <span className="text-xs font-black uppercase tracking-widest">{t('jilebi.explanation')}</span>
                                </div>
                                <div className="bg-white p-8 rounded-3xl border border-amber-50 shadow-sm text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">
                                    {currentPuzzle.explanation}
                                </div>
                            </div>

                            <div className="text-center pt-4">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-8 py-3 border rounded-full bg-gray-50 shadow-sm">
                                    ಅಭಿನಂದನೆಗಳು! ಇಂದಿನ ಸವಾಲು ಪೂರ್ಣಗೊಂಡಿದೆ
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
