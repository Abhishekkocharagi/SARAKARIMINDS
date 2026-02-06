'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Exam {
    _id: string;
    name: string;
    fullName: string;
    conductingBody: string;
    logoUrl?: string; // Add this
    examLevel: string;
    category: string;
    status: string;
}

export default function ExamsHub() {
    const { user, updateUser } = useAuth();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    // const [saving, setSaving] = useState(false); // Fixed: assigned but never used
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/exams');
            if (res.ok) {
                const data = await res.json();
                setExams(data);
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const preferredExamIds = user?.preferredExams?.map((e: { _id: string } | string) => typeof e === 'object' ? e._id : e) || [];
    const isPreferred = (id: string) => preferredExamIds.includes(id);

    const toggleExam = async (id: string) => {
        const newPreferredIds = isPreferred(id)
            ? preferredExamIds.filter((e: string) => e !== id)
            : [...preferredExamIds, id];

        if (newPreferredIds.length > 5) return alert('Maximum 5 preferred exams allowed');
        if (newPreferredIds.length === 0) return alert('At least 1 preferred exam is mandatory');

        // setSaving(true);
        try {
            const res = await fetch('http://localhost:5000/api/exams/select', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ preferredExamIds: newPreferredIds })
            });
            if (res.ok) {
                const data = await res.json();
                updateUser({
                    preferredExams: data.preferredExams,
                    exams: data.exams,
                    examHashtags: data.examHashtags
                });
            }
        } catch (error) {
            console.error('Error selecting exam:', error);
        } finally {
            // setSaving(false);
        }
    };

    const preferredList = exams.filter(e => isPreferred(e._id));
    const exploreList = exams.filter(e => !isPreferred(e._id) && (
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    ));

    // Group exploreList by category
    const groupedExplore = exploreList.reduce((acc: Record<string, Exam[]>, exam) => {
        if (!acc[exam.category]) acc[exam.category] = [];
        acc[exam.category].push(exam);
        return acc;
    }, {});

    const ExamCard = ({ exam, highlighted = false }: { exam: Exam, highlighted?: boolean }) => (
        <div
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative group ${highlighted
                ? 'border-blue-600 bg-blue-50/20 shadow-lg shadow-blue-500/5'
                : 'border-gray-100 bg-white hover:border-blue-200'
                }`}
            onClick={() => toggleExam(exam._id)}
        >
            <div className="flex justify-between items-start mb-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-sm overflow-hidden border ${highlighted ? 'bg-white border-blue-200' : 'bg-gray-50 border-gray-100'
                    }`}>
                    {exam.logoUrl ? (
                        <img src={exam.logoUrl} alt={`${exam.name} Logo`} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-2xl">🏛️</span>
                    )}
                </div>
                {highlighted && (
                    <div className="bg-blue-600 text-white p-0.5 rounded-full shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                )}
            </div>
            <h3 className="text-base font-black text-gray-900 leading-tight">{exam.name}</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{exam.conductingBody}</p>
            <p className="text-xs text-gray-500 font-bold mt-2 line-clamp-2 h-6 leading-tight">{exam.fullName}</p>
            <div className="mt-2 flex gap-2">
                <Link
                    href={`/exams/${exam.name}`}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    View Details →
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 pt-6 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                <div className="flex-1 min-w-0 space-y-8">
                    {/* Search Bar */}
                    <div className="flex justify-start">
                        <div className="bg-white rounded-xl p-1 border border-gray-100 shadow-sm w-full max-w-sm">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search other exams..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-50 border border-transparent p-2 pl-9 rounded-lg font-bold text-xs outline-none focus:bg-white focus:border-blue-600 transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preferred Exams Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 ml-2">
                            <span className="text-2xl">⭐</span>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Your Preferred Exams</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Targeting prioritized updates & communities</p>
                            </div>
                        </div>
                        {preferredList.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Select preferred exams to personalize your experience</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {preferredList.map(exam => <ExamCard key={exam._id} exam={exam} highlighted={true} />)}
                            </div>
                        )}
                    </section>

                    {/* Explore Section */}
                    <section className="space-y-6 pt-4">
                        <div className="flex items-center gap-3 ml-2">
                            <span className="text-2xl">🔍</span>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Explore Other Exams</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Find and track new opportunities</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-2xl"></div>)}
                            </div>
                        ) : Object.keys(groupedExplore).length === 0 ? (
                            <p className="text-center py-8 text-gray-400 font-bold uppercase tracking-widest text-xs">No matching exams found</p>
                        ) : (
                            Object.entries(groupedExplore).map(([category, list]) => (
                                <div key={category} className="space-y-4">
                                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50/50 px-4 py-2 rounded-lg inline-block">{category}</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {list.map((exam) => <ExamCard key={exam._id} exam={exam} />)}
                                    </div>
                                </div>
                            ))
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
