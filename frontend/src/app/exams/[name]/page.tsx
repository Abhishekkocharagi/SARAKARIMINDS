'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { FiBook, FiFileText, FiBell, FiUsers, FiAward } from 'react-icons/fi';

export default function ExamDetailsPage() {
    const { name } = useParams();
    const searchParams = useSearchParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

    useEffect(() => {
        fetchExamDetails();
    }, [name]);

    const fetchExamDetails = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/exams/${name}`);
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
    if (!data) return <div className="p-20 text-center text-red-500 font-bold">Exam not found</div>;

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
                    {exam.officialPartnerAcademy && (
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
                        {['overview', 'syllabus', 'updates', 'documents', 'communities', 'mentors'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm min-h-[400px]">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-xl font-black text-gray-900 mb-4">Exam Overview</h3>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{exam.overview || "Updates coming soon: Official overview, job roles, and department details are being finalized."}</p>
                                </section>
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
                                <h3 className="text-xl font-black text-gray-900 mb-4">Exam Pattern & Syllabus</h3>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed font-medium">
                                        {exam.examPattern || "Updates coming soon: Detailed syllabus and exam pattern documentation will be available shortly."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'updates' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-gray-900 mb-4">Latest Job Updates</h3>
                                {updates.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 font-bold">No updates found for this exam newly.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {updates.map((update: any) => (
                                            <div key={update._id} className="p-6 border rounded-2xl hover:border-blue-200 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${update.type === 'Vacancy' ? 'bg-green-50 text-green-600' :
                                                            update.type === 'Result' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                            }`}>
                                                            {update.type}
                                                        </span>
                                                        <h4 className="text-lg font-black text-gray-900 mt-2">{update.title}</h4>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">Updates by <span className="text-blue-600 italic">{update.publisherName || "Admin"}</span></p>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(update.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-3">{update.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-gray-900 mb-4">Official Documents (PDF)</h3>
                                {documents.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 font-bold">No official documents uploaded yet.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {documents.map((doc: any) => (
                                            <a
                                                key={doc._id}
                                                href={doc.fileUrl}
                                                target="_blank"
                                                className="p-4 border border-gray-100 rounded-xl flex items-center justify-between hover:bg-red-50 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">📄</span>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-900">{doc.title}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{doc.category}</p>
                                                    </div>
                                                </div>
                                                <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-1 rounded group-hover:bg-red-200 transition">PDF</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'mentors' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-gray-900 mb-4">Verified Mentors & Academies</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {exam.verifiedMentors?.map((mentor: any) => (
                                        <div key={mentor._id} className="p-4 border rounded-xl flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                                                <img src={mentor.profilePic || "https://i.pravatar.cc/150"} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{mentor.name}</p>
                                                <p className="text-[10px] text-blue-600 font-black uppercase">Verified Mentor</p>
                                            </div>
                                        </div>
                                    ))}
                                    {exam.verifiedAcademies?.map((academy: any) => (
                                        <div key={academy._id} className="p-4 border rounded-xl flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                                                <img src={academy.profilePic || "https://i.pravatar.cc/150"} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{academy.name}</p>
                                                <p className="text-[10px] text-purple-600 font-black uppercase">Official Academy</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!exam.verifiedMentors?.length && !exam.verifiedAcademies?.length) && (
                                        <p className="text-gray-400 text-xs font-bold col-span-full">No associated mentors or academies yet.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'communities' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-black text-gray-900">Exam Communities</h3>
                                </div>
                                {communities.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 font-bold">No communities created for this exam yet.</div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {communities.map((comm: any) => (
                                            <div key={comm._id} className="p-6 border rounded-2xl hover:shadow-md transition bg-gradient-to-br from-white to-gray-50/50">
                                                <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">{comm.name}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold mt-1 line-clamp-2">{comm.description}</p>
                                                <div className="mt-4 flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">
                                                        {comm.type === 'paid' ? `₹${comm.price}` : 'Free'}
                                                    </span>
                                                    <button className="text-[10px] font-black bg-gray-900 text-white px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-blue-600 transition">Join Group</button>
                                                </div>
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
