'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiTrash2, FiPlus, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const subjects = [
    'General Knowledge',
    'Current Affairs',
    'Aptitude',
    'Reasoning',
    'Kannada',
    'English'
];

interface QuizStatus {
    subject: string;
    count: number;
}

interface Question {
    _id: string;
    subject: string;
    questionText: string;
    options: string[];
    correctOptionIndex: number;
}

export default function AdminQuizPage() {
    const { user } = useAuth();
    const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
    const [status, setStatus] = useState<QuizStatus[]>([]);
    const [todayQuestions, setTodayQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctIndex, setCorrectIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user?.token) {
            fetchStatus();
        }
    }, [user]);

    useEffect(() => {
        if (user?.token && selectedSubject) {
            fetchTodayQuestions();
        }
    }, [user, selectedSubject]);

    const fetchStatus = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/quiz/admin/status', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (err) {
            console.error('Failed to fetch status', err);
        }
    };

    const fetchTodayQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/quiz/admin/today/${encodeURIComponent(selectedSubject)}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTodayQuestions(data);
            }
        } catch (err) {
            console.error('Failed to fetch today questions', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!questionText || options.some(opt => !opt)) {
            alert('Please fill all fields');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/api/quiz/admin/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({
                    subject: selectedSubject,
                    questionText,
                    options,
                    correctOptionIndex: correctIndex
                })
            });

            if (res.ok) {
                setMessage('Question added successfully!');
                setQuestionText('');
                setOptions(['', '', '', '']);
                setCorrectIndex(0);
                fetchStatus();
                fetchTodayQuestions();
                setTimeout(() => setMessage(''), 3000);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to add question');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/quiz/admin/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                fetchStatus();
                fetchTodayQuestions();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="bg-white p-8 rounded-[2rem] border shadow-sm">
                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Direct Daily Quiz</h1>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Manage today's questions (5 per subject)</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Status & Subject Selection */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Today's Progress</h2>
                        <div className="space-y-3">
                            {subjects.map(sub => {
                                const s = status.find(item => item.subject === sub);
                                const count = s?.count || 0;
                                const isSelected = selectedSubject === sub;
                                return (
                                    <button
                                        key={sub}
                                        onClick={() => setSelectedSubject(sub)}
                                        className={`w-full flex justify-between items-center p-4 rounded-2xl border transition-all ${isSelected ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-gray-100 hover:border-blue-200 bg-white'}`}
                                    >
                                        <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{sub}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-black ${count === 5 ? 'text-green-600' : count > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                                                {count} / 5
                                            </span>
                                            {count === 5 ? <FiCheckCircle className="text-green-500" /> : <FiAlertCircle className="text-gray-300" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Add Form & Today's Questions */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Add Form */}
                    <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                            <FiPlus className="text-blue-600" /> Add Question for {selectedSubject}
                        </h2>

                        <form onSubmit={handleAddQuestion} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Question Text</label>
                                <textarea
                                    required
                                    value={questionText}
                                    onChange={(e) => setQuestionText(e.target.value)}
                                    placeholder="Enter question here..."
                                    className="w-full bg-gray-50 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {options.map((opt, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Option {String.fromCharCode(65 + idx)}</label>
                                            <input
                                                type="radio"
                                                name="correctIndex"
                                                checked={correctIndex === idx}
                                                onChange={() => setCorrectIndex(idx)}
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                            />
                                        </div>
                                        <input
                                            required
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...options];
                                                newOpts[idx] = e.target.value;
                                                setOptions(newOpts);
                                            }}
                                            className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <span className="text-xs text-gray-400 font-bold italic">* Mark the radio button for correct answer</span>
                                <button
                                    type="submit"
                                    disabled={submitting || (status.find(s => s.subject === selectedSubject)?.count || 0) >= 5}
                                    className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${submitting || (status.find(s => s.subject === selectedSubject)?.count || 0) >= 5 ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20'}`}
                                >
                                    {submitting ? 'Adding...' : (status.find(s => s.subject === selectedSubject)?.count || 0) >= 5 ? 'Limit Reached' : 'Add Question'}
                                </button>
                            </div>
                        </form>

                        {message && (
                            <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 font-bold text-center animate-in fade-in zoom-in">
                                {message}
                            </div>
                        )}
                    </div>

                    {/* Today's List */}
                    <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
                        <div className="p-8 border-b bg-gray-50/50">
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Today's {selectedSubject} Questions</h2>
                        </div>
                        <div className="p-8">
                            {loading ? (
                                <div className="text-center py-10 animate-pulse text-gray-300 font-black uppercase tracking-widest">Loading...</div>
                            ) : todayQuestions.length > 0 ? (
                                <div className="space-y-4">
                                    {todayQuestions.map((q, idx) => (
                                        <div key={q._id} className="p-6 rounded-2xl border border-gray-100 bg-white group hover:border-blue-200 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Q{idx + 1}</span>
                                                <button
                                                    onClick={() => handleDelete(q._id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                            <p className="font-bold text-gray-900 mb-4 text-sm leading-relaxed">{q.questionText}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className={`text-[10px] p-2 rounded-lg border ${oIdx === q.correctOptionIndex ? 'bg-green-50 border-green-100 text-green-700 font-bold' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                                        {String.fromCharCode(65 + oIdx)}. {opt} {oIdx === q.correctOptionIndex && '✓'}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs opacity-50">No questions added for today yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
