'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';

interface JobUpdate {
    _id: string;
    title: string;
    organization: string;
    description: string;
    eligibility: string;
    location: string;
    hashtags: string[];
    applicationLink?: string;
    createdAt: string;
}

export default function JobDetailsPage() {
    const { id } = useParams();
    const { t } = useLanguage();
    const [job, setJob] = useState<JobUpdate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetchJobDetails();
        }
    }, [id]);

    const fetchJobDetails = async () => {
        try {
            // Using relative path to avoid localhost issues if deployed, 
            // but for now, we know it's port 5000 based on previous files.
            const res = await fetch(`http://localhost:5000/api/jobs/${id}`);
            if (res.ok) {
                const data = await res.json();
                setJob(data);
            } else {
                setError('Job not found');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load job details');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (job?.applicationLink) {
            window.open(job.applicationLink, '_blank');
        } else {
            alert('No application link provided for this job. Please check the description for details.');
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto pt-6 px-6 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                <div className="flex-1 min-w-0">
                    {loading ? (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                            <span className="animate-spin text-3xl inline-block">⏳</span>
                            <p className="mt-2 text-gray-500 font-bold uppercase text-xs tracking-widest">Loading Job Details...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                            <span className="text-4xl">⚠️</span>
                            <h2 className="mt-4 text-xl font-black text-gray-900">{error}</h2>
                            <p className="text-gray-500 mt-2">The job post you are looking for might have been removed or the ID is invalid.</p>
                        </div>
                    ) : job ? (
                        <div className="space-y-6">
                            {/* Header Card */}
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -mr-16 -mt-16 z-0"></div>
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between">
                                        <div className="w-full">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="inline-block px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    Official Update
                                                </span>
                                                <span className="text-blue-700 font-black text-xs uppercase tracking-tighter">
                                                    {job.organization}
                                                </span>
                                            </div>
                                            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                                                {job.title}
                                            </h1>
                                            <div className="flex flex-wrap items-center gap-6 text-[10px] text-gray-500 font-black uppercase tracking-widest border-t border-gray-50 pt-4">
                                                <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                                                    📍 {job.location || 'Remote / Across India'}
                                                </span>
                                                <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                                                    📅 Posted {formatDistanceToNow(new Date(job.createdAt))} ago
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 gap-6">
                                {/* Eligibility Section */}
                                {job.eligibility && (
                                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">🎓</div>
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Eligibility Criteria</h3>
                                        </div>
                                        <div className="bg-blue-50/30 rounded-2xl p-6 border border-blue-100/50">
                                            <p className="text-gray-800 font-bold text-sm whitespace-pre-wrap leading-relaxed">
                                                {job.eligibility}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Description Section */}
                                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">📝</div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Full Job Description</h3>
                                    </div>
                                    <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed font-medium text-base">
                                        {job.description}
                                    </div>
                                </div>

                                {/* Hashtags / Exam Tags */}
                                {job.hashtags && job.hashtags.length > 0 && (
                                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Related Exams</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {job.hashtags.map((tag, i) => (
                                                <span key={i} className="px-5 py-2.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-xl border border-gray-100 text-gray-600 font-black text-[10px] uppercase tracking-widest cursor-default">
                                                    #{tag.replace(/#/g, '')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Footer */}
                            <div className="bg-blue-900 rounded-2xl p-8 shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h4 className="text-xl font-black tracking-tight">Interested in this opportunity?</h4>
                                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">Check official notification for application details</p>
                                </div>
                                <button
                                    onClick={handleApply}
                                    className="bg-white text-blue-900 px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-50 transition-colors shadow-xl"
                                >
                                    Apply Now
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </main>
        </div>
    );
}
