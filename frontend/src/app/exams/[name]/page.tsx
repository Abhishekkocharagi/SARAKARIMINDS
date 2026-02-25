'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { FiBook, FiFileText, FiBell, FiUsers, FiAward } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';

import { Suspense } from 'react';

function ExamDetailsContent() {
    const { name } = useParams();
    const searchParams = useSearchParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (searchParams) {
            const tab = searchParams.get('tab');
            if (tab) setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchExamDetails();
    }, [name]);

    const fetchExamDetails = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/exams/${name}`);
            if (res.ok) {
                setData(await res.json());
            }
        } catch (error) {
            console.error('Error fetching exam details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-bold">Loading...</div>;
    if (!data || !data.exam) return <div className="p-20 text-center text-red-500 font-bold">Exam not found</div>;

    const { exam, updates, documents, communities } = data;

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 pt-6 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                <div className="flex-1 min-w-0 space-y-6">
                    {/* Header Card */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                        {/* Background Watermark */}
                        <div className="absolute -top-6 -right-6 p-8 opacity-5 grayscale pointer-events-none transform rotate-12">
                            {exam.logoUrl ? (
                                <img src={exam.logoUrl} className="w-64 h-64 object-contain" alt="" />
                            ) : (
                                <span className="text-9xl">🏛️</span>
                            )}
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                            {/* Logo Box */}
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-center shadow-lg shadow-gray-200/50 flex-shrink-0">
                                {exam.logoUrl ? (
                                    <img src={exam.logoUrl} alt={exam.name} className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-5xl text-gray-300">🏛️</span>
                                )}
                            </div>

                            <div className="flex-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4 inline-block">
                                    {exam.conductingBody}
                                </span>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight mb-2">
                                    {exam.name} <span className="text-gray-400 hidden sm:inline">– {exam.fullName}</span>
                                </h1>
                                <p className="text-sm font-bold text-gray-400 sm:hidden mb-4">{exam.fullName}</p>

                                <div className="flex gap-4 mt-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <FiAward className="text-blue-500" /> {exam.examLevel} Level
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <FiBook className="text-purple-500" /> {exam.category}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Academy Partner Section */}
                    {exam.officialPartnerAcademy && typeof exam.officialPartnerAcademy === 'object' && (
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-blue-50 rounded-xl border border-blue-100 p-2 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={exam.partnerAcademyLogo || exam.officialPartnerAcademy.profilePic || "https://i.pravatar.cc/150"}
                                        className="w-full h-full object-contain mix-blend-multiply"
                                        alt="Academy Partner"
                                    />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Official Exam Partner</p>
                                    <h2 className="text-xl font-black text-gray-900">{exam.officialPartnerAcademy.name}</h2>
                                    <p className="text-xs text-gray-400 font-bold mt-1">Leading {exam.name} Excellence Hub</p>
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <Link
                                    href={`/profile/${exam.officialPartnerAcademy._id}`}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                                >
                                    View Academy
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="bg-white rounded-2xl px-6 pt-6 shadow-sm border border-gray-100 flex gap-8 overflow-x-auto custom-scrollbar">
                        {['overview', 'syllabus', 'updates', 'documents', 'previousYearPapers', 'modelPapers', 'communities', 'mentors'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {tab.replace(/([A-Z])/g, ' $1')}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm min-h-[400px]">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-gray-900 mb-4">Exam Overview</h3>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 italic">
                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed font-medium">
                                        {exam.overview || "Official overview is being updated."}
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t">
                                    <section>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Job Role</h4>
                                        <p className="text-sm font-bold text-gray-700">{exam.jobRole || "N/A"}</p>
                                    </section>
                                    <section>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Salary Scale</h4>
                                        <p className="text-sm font-bold text-gray-700">{exam.salaryScale || "N/A"}</p>
                                    </section>
                                </div>
                            </div>
                        )}

                        {activeTab === 'syllabus' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-gray-900 mb-4">Detailed Syllabus</h3>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed font-medium">
                                        {exam.syllabus || "Syllabus details are being updated."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'updates' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-gray-900 mb-4">Latest Updates</h3>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed font-medium">
                                        {exam.updates || "Current updates are being compiled."}
                                    </p>
                                </div>
                                {updates.length > 0 && (
                                    <div className="space-y-4 pt-6 border-t mt-6">
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Official Notices</h4>
                                        {updates.map((update: any) => (
                                            <div key={update._id} className="p-4 border rounded-xl">
                                                <h5 className="font-bold text-gray-900 text-sm">{update.title}</h5>
                                                <p className="text-xs text-gray-500 mt-1">{update.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-gray-900 mb-4">Official Documents</h3>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed font-medium">
                                        {exam.documents || "Document list is being updated."}
                                    </p>
                                </div>
                                {documents.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        {documents.map((doc: any) => (
                                            <div key={doc._id} className="p-4 border rounded-xl flex items-center justify-between hover:border-red-100 transition bg-white group shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500 text-xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                                                        📄
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{doc.title}</p>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{doc.category || 'Official Document'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <a
                                                        href={doc.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[8px] font-black bg-blue-50 text-blue-600 px-3 py-2 rounded-lg uppercase tracking-widest hover:bg-blue-600 hover:text-white transition shadow-sm"
                                                    >
                                                        View
                                                    </a>
                                                    <a
                                                        href={doc.fileUrl}
                                                        download={`${doc.title}.pdf`}
                                                        className="text-[8px] font-black bg-gray-50 text-gray-500 px-3 py-2 rounded-lg uppercase tracking-widest hover:bg-gray-900 hover:text-white transition shadow-sm"
                                                    >
                                                        Download
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'previousYearPapers' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-gray-900 mb-4">Previous Year Question Papers</h3>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed font-medium">
                                        {exam.previousYearPapers || "Previous papers are being uploaded."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'modelPapers' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-gray-900 mb-4">Model Question Papers</h3>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed font-medium">
                                        {exam.modelPapers || "Model papers are being compiled."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'communities' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-gray-900 mb-4">Exam Communities</h3>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed font-medium">
                                        {exam.communities || "Community links are being updated."}
                                    </p>
                                </div>
                                {communities.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                                        {communities.map((comm: any) => (
                                            <div key={comm._id} className="p-6 border rounded-2xl">
                                                <h4 className="font-black text-gray-900">{comm.name}</h4>
                                                <button className="mt-4 text-[10px] font-black bg-gray-900 text-white px-4 py-2 rounded-lg uppercase">Join Group</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'mentors' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-gray-900 mb-4">Expert Mentors</h3>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed font-medium">
                                        {exam.mentors || "Mentor pool is being finalized."}
                                    </p>
                                </div>
                                {exam.verifiedMentors?.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                                        {exam.verifiedMentors.map((mentor: any) => (
                                            <div key={mentor._id} className="p-4 border rounded-xl flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden">
                                                    <img src={mentor.profilePic || "https://i.pravatar.cc/150"} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-bold text-sm">{mentor.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ExamDetailsPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center font-bold">Loading...</div>}>
            <ExamDetailsContent />
        </Suspense>
    );
}
