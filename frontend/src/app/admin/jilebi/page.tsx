'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiPlus, FiTrash2, FiEdit2, FiCalendar, FiBox } from 'react-icons/fi';

interface JilebiPuzzle {
    _id: string;
    puzzleType: 'sequence' | 'pattern' | 'word_connect' | 'logic_grid' | 'visual';
    question: string;
    options: any;
    correctAnswer: any;
    explanation: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    activeDate: string;
    isActive: boolean;
}

export default function AdminJilebiPage() {
    const { user } = useAuth();
    const [puzzles, setPuzzles] = useState<JilebiPuzzle[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [puzzleType, setPuzzleType] = useState<JilebiPuzzle['puzzleType']>('word_connect');
    const [question, setQuestion] = useState('');
    const [explanation, setExplanation] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
    const [isActive, setIsActive] = useState(true);

    // Dynamic data state based on type
    const [wordAnswer, setWordAnswer] = useState(''); // for Word Connect Answer
    const [wordOptions, setWordOptions] = useState(''); // for Word Connect Scrambled Pool
    const [sequenceItems, setSequenceItems] = useState(''); // for Sequence

    useEffect(() => {
        if (user?.token) {
            fetchPuzzles();
        }
    }, [user]);

    const fetchPuzzles = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/admin/jilebi', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPuzzles(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        let options: any[] = [];
        let correctAnswer: any = null;

        if (puzzleType === 'word_connect') {
            options = wordOptions.split(',').map(l => l.trim().toUpperCase()).filter(l => l);
            correctAnswer = wordAnswer.trim().toUpperCase();
        } else if (puzzleType === 'sequence') {
            options = sequenceItems.split(',').map(i => i.trim());
            correctAnswer = options; // For sequence, correctAnswer is the array in right order
        }

        const payload = {
            puzzleType,
            question,
            options,
            correctAnswer,
            explanation,
            difficulty,
            activeDate,
            isActive
        };

        try {
            const url = editingId
                ? `http://localhost:5000/api/admin/jilebi/${editingId}`
                : 'http://localhost:5000/api/admin/jilebi';

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                setMessage(editingId ? 'ಪಜಲ್ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ!' : 'ಕ್ವಿಜ್ ಪಜಲ್ ಸೇರಿಸಲಾಗಿದೆ!');
                resetForm();
                fetchPuzzles();
                setTimeout(() => setMessage(''), 3000);
            } else {
                alert(data.message || 'Error occurred');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setQuestion('');
        setExplanation('');
        setWordAnswer('');
        setWordOptions('');
        setSequenceItems('');
        setIsActive(true);
    };

    const handleEdit = (p: JilebiPuzzle) => {
        setEditingId(p._id);
        setPuzzleType(p.puzzleType);
        setQuestion(p.question);
        setExplanation(p.explanation);
        setDifficulty(p.difficulty);
        setActiveDate(p.activeDate);
        setIsActive(p.isActive);

        if (p.puzzleType === 'word_connect') {
            setWordAnswer(p.correctAnswer);
            setWordOptions(Array.isArray(p.options) ? p.options.join(', ') : '');
        } else if (p.puzzleType === 'sequence') {
            setSequenceItems(Array.isArray(p.correctAnswer) ? p.correctAnswer.join(', ') : '');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this puzzle?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/jilebi/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) fetchPuzzles();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <header className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-amber-900 uppercase tracking-tight">ಡೈಲಿ ಕ್ವಿಜ್ ಪಜಲ್ ಮ್ಯಾನೇಜ್‌ಮೆಂಟ್</h1>
                    <p className="text-amber-700 font-bold text-xs uppercase tracking-widest mt-1">Interactive Education Platform</p>
                </div>
                {message && (
                    <div className="bg-green-100 text-green-700 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">
                        {message}
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8 flex items-center gap-3">
                            {editingId ? <FiEdit2 className="text-blue-600" /> : <FiPlus className="text-amber-600" />}
                            {editingId ? 'Edit Quiz Puzzle' : 'Create New Quiz Puzzle'}
                        </h2>

                        <form onSubmit={handleAddOrUpdate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Puzzle Type</label>
                                    <select
                                        value={puzzleType}
                                        onChange={(e) => setPuzzleType(e.target.value as any)}
                                        className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="word_connect">Word Connect (ಪದ ಜೋಡಣೆ)</option>
                                        <option value="sequence">Sequence (ಕ್ರಮ)</option>
                                    </select>
                                </div>
                                ...
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Difficulty</label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value as any)}
                                        className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question (Kannada)</label>
                                <textarea
                                    required
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="Enter puzzle question here..."
                                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-5 py-4 text-sm font-medium min-h-[100px]"
                                />
                            </div>

                            {puzzleType === 'word_connect' && (
                                <div className="space-y-6 animate-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Correct Answer (Word)</label>
                                        <input
                                            required
                                            value={wordAnswer}
                                            onChange={(e) => setWordAnswer(e.target.value)}
                                            placeholder="E.g., ಕುವೆಂಪು"
                                            className="w-full bg-gray-50 border-gray-100 rounded-xl px-5 py-3 text-sm font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Letter Pool (Scrambled letters + Extras, Comma Separated)</label>
                                        <input
                                            required
                                            value={wordOptions}
                                            onChange={(e) => setWordOptions(e.target.value)}
                                            placeholder="E.g., ಕು, ವೆಂ, ಪು, ಲ, ಮ"
                                            className="w-full bg-gray-50 border-gray-100 rounded-xl px-5 py-3 text-sm font-bold"
                                        />
                                    </div>
                                </div>
                            )}

                            {puzzleType === 'sequence' && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Correct Sequence (Comma Separated)</label>
                                    <input
                                        required
                                        value={sequenceItems}
                                        onChange={(e) => setSequenceItems(e.target.value)}
                                        placeholder="E.g., ಮೊಳಕೆ, ಸಸಿ, ಗಿಡ, ಮರ"
                                        className="w-full bg-gray-50 border-gray-100 rounded-xl px-5 py-3 text-sm font-bold"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Explanation (Kannada)</label>
                                <textarea
                                    required
                                    value={explanation}
                                    onChange={(e) => setExplanation(e.target.value)}
                                    placeholder="Explain the solution logic in Kannada..."
                                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-5 py-4 text-sm font-medium min-h-[100px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={activeDate}
                                        onChange={(e) => setActiveDate(e.target.value)}
                                        className="w-full bg-gray-50 border-gray-100 rounded-xl px-5 py-3 text-sm font-bold"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100 cursor-pointer w-full shadow-sm">
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={(e) => setIsActive(e.target.checked)}
                                            className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-amber-900 uppercase">Set as Today's Active</span>
                                            <span className="text-[9px] text-amber-400 mt-1 uppercase">Recommended: 1 per day</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                                <button
                                    disabled={submitting}
                                    className={`${editingId ? 'bg-blue-600' : 'bg-amber-600'} text-white ml-auto px-10 py-4 rounded-full font-black uppercase text-xs tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95`}
                                >
                                    {submitting ? 'Processing...' : (editingId ? 'Update Puzzle' : 'Publish Quiz')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm sticky top-8">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Puzzle Inventory</h2>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{puzzles.length} Available</span>
                        </div>

                        <div className="space-y-4 max-h-[800px] overflow-y-auto no-scrollbar">
                            {puzzles.map(p => (
                                <div key={p._id} className={`p-5 rounded-3xl border transition-all ${p.isActive ? 'bg-amber-50/30 border-amber-100 ring-1 ring-amber-100' : 'bg-gray-50/30 border-gray-100'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex gap-2">
                                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${p.isActive ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                {p.isActive ? 'Active Today' : 'Scheduled'}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEdit(p)} className="text-gray-400 hover:text-blue-500 p-1 transition-colors"><FiEdit2 size={12} /></button>
                                            <button onClick={() => handleDelete(p._id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors"><FiTrash2 size={12} /></button>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-900 mb-3 line-clamp-2">{p.question}</p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <FiCalendar size={10} className="text-gray-400" />
                                            <span className="text-[9px] font-bold text-gray-400">{p.activeDate}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <FiBox size={10} className="text-gray-400" />
                                            <span className="text-[9px] font-bold text-gray-400 uppercase">{p.puzzleType.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
