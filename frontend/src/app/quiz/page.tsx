'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const subjects = [
    'General Knowledge',
    'Current Affairs',
    'Aptitude',
    'Reasoning',
    'Kannada',
    'English'
];

interface Question {
    _id: string;
    questionText: string;
    options: string[];
    correctOptionIndex: number;
}

interface Attempt {
    selectedIdx: number;
    isCorrect: boolean;
}

export default function QuizPage() {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [attempts, setAttempts] = useState<Record<string, Attempt>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchQuiz = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`http://localhost:5000/api/quiz/${encodeURIComponent(selectedSubject)}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQuestions(data);
            } else {
                const data = await res.json();
                setError(data.message || 'Quiz not available for this subject yet.');
                setQuestions([]);
            }
        } catch {
            setError('Failed to load quiz questions.');
        } finally {
            setLoading(false);
        }
    }, [selectedSubject, user?.token]);

    useEffect(() => {
        if (user && selectedSubject) {
            fetchQuiz();
        }
    }, [user, selectedSubject, fetchQuiz]);

    const handleAnswer = (questionId: string, optionIdx: number, correctIdx: number) => {
        if (attempts[questionId]) return; // Already answered

        setAttempts(prev => ({
            ...prev,
            [questionId]: {
                selectedIdx: optionIdx,
                isCorrect: optionIdx === correctIdx
            }
        }));
    };

    const calculateSubjectScore = () => {
        let score = 0;
        questions.forEach(q => {
            if (attempts[q._id]?.isCorrect) score++;
        });
        return score;
    };

    const calculateOverallScore = () => {
        let total = 0;
        Object.values(attempts).forEach(att => {
            if (att.isCorrect) total++;
        });
        return total;
    };

    const isSubjectCompleted = () => {
        return questions.length > 0 && questions.every(q => !!attempts[q._id]);
    };

    useEffect(() => {
        if (isSubjectCompleted() && questions.length === 5) {
            const recordCompletion = async () => {
                try {
                    const res = await fetch('http://localhost:5000/api/quiz/complete', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${user?.token}`
                        }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.dailyQuizStreakCount) {
                            updateUser({ dailyQuizStreakCount: data.dailyQuizStreakCount });
                        }
                    }
                } catch {
                    console.error('Failed to record quiz completion streak');
                }
            };
            recordCompletion();
        }
    }, [attempts, questions]);

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 pt-6 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                <div className="flex-1 space-y-6">
                    {/* Header with Results Summary */}
                    <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t('quiz.title')}</h1>
                                <p className="text-gray-500 font-bold text-[10px] tracking-[0.2em] uppercase mt-1">{t('quiz.subtitle')}</p>
                            </div>
                            <div className="bg-blue-900 text-white px-8 py-4 rounded-3xl flex items-center gap-4 shadow-xl shadow-blue-900/20">
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('quiz.total_score')}</p>
                                    <p className="text-2xl font-black">{calculateOverallScore()} <span className="text-sm opacity-50">/ {subjects.length * 5}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Subject Tabs */}
                        <div className="flex gap-2 mt-8 overflow-x-auto no-scrollbar pb-2">
                            {subjects.map(sub => (
                                <button
                                    key={sub}
                                    onClick={() => setSelectedSubject(sub)}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedSubject === sub ? 'bg-black text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quiz Content */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-20 animate-pulse text-gray-300 font-black uppercase tracking-widest">Fetching Questions...</div>
                        ) : error ? (
                            <div className="bg-white p-12 rounded-[2.5rem] border shadow-sm text-center">
                                <div className="text-4xl mb-4 opacity-20">🕒</div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">{t('quiz.not_ready')}</h3>
                                <p className="text-gray-500 font-medium text-sm">{error}</p>
                            </div>
                        ) : (
                            <>
                                {questions.map((q, idx) => {
                                    const attempt = attempts[q._id];
                                    return (
                                        <div key={q._id} className="bg-white p-8 rounded-[2rem] border shadow-sm card-hover transition-all">
                                            <div className="flex justify-between items-start mb-6">
                                                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Question {idx + 1}</span>
                                                {attempt && (
                                                    <span className={`text-xl ${attempt.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                                        {attempt.isCorrect ? '✔️' : '❌'}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-black text-gray-900 mb-8 leading-snug">{q.questionText}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {q.options.map((opt, oIdx) => {
                                                    const isSelected = attempt?.selectedIdx === oIdx;
                                                    const isCorrect = q.correctOptionIndex === oIdx;

                                                    let boxStyles = "bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100 hover:border-gray-200";
                                                    if (attempt) {
                                                        if (isCorrect) boxStyles = "bg-green-50 border-green-500 text-green-700 font-bold border-2";
                                                        else if (isSelected) boxStyles = "bg-red-50 border-red-500 text-red-700 font-bold border-2";
                                                        else boxStyles = "bg-gray-50 border-gray-100 text-gray-300 pointer-events-none";
                                                    }

                                                    return (
                                                        <button
                                                            key={oIdx}
                                                            disabled={!!attempt}
                                                            onClick={() => handleAnswer(q._id, oIdx, q.correctOptionIndex)}
                                                            className={`p-4 rounded-2xl text-left text-sm transition-all flex justify-between items-center border ${boxStyles}`}
                                                        >
                                                            <span>{opt}</span>
                                                            {attempt && isCorrect && <span className="text-green-600 font-black">✓</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                {isSubjectCompleted() && questions.length === 5 && (
                                    <div className="bg-green-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-green-600/20 flex flex-col items-center animate-in zoom-in">
                                        <div className="text-4xl mb-2">🎉</div>
                                        <h3 className="text-xl font-black uppercase tracking-tight mb-1">{selectedSubject} {t('quiz.completed')}</h3>
                                        <p className="text-sm font-bold opacity-80 mb-6">You scored {calculateSubjectScore()} out of 5</p>
                                        <div className="flex gap-4">
                                            {subjects.indexOf(selectedSubject) < subjects.length - 1 && (
                                                <button
                                                    onClick={() => setSelectedSubject(subjects[subjects.indexOf(selectedSubject) + 1])}
                                                    className="bg-white text-green-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all font-outfit"
                                                >
                                                    {t('quiz.next_subject')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
