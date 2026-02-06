'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface JobUpdate {
    _id: string;
    title: string;
    organization: string;
    description: string;
    eligibility: string;
    location: string;
    hashtags: string[];
    createdAt: string;
}

export default function JobUpdatesPage() {
    const [jobs, setJobs] = useState<JobUpdate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/jobs');
                if (res.ok) {
                    const data = await res.json();
                    setJobs(data);
                }
            } catch (error) {
                console.error('Error fetching jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <div className="max-w-7xl mx-auto pt-6 px-6 pb-10 flex flex-col md:flex-row gap-6">
                {/* Desktop Sidebar */}
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">Latest Job Updates</h1>
                                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Found {jobs.length} opportunities matching Karnataka exams</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                                💼
                            </div>
                        </div>

                        {loading ? (
                            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                                <span className="animate-spin text-3xl inline-block">⏳</span>
                                <p className="mt-2 text-gray-500 font-black uppercase text-xs tracking-widest">Loading latest updates...</p>
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="bg-white rounded-2xl p-20 text-center shadow-sm">
                                <span className="text-6xl mb-4 block">📭</span>
                                <h2 className="text-xl font-black text-gray-900 uppercase">No Jobs Found</h2>
                                <p className="text-gray-500 mt-2 font-medium">We'll notify you as soon as new job updates are posted by admins.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {jobs.map((job) => (
                                    <Link
                                        key={job._id}
                                        href={`/job-updates/${job._id}`}
                                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-blue-100 transition-colors z-0"></div>

                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-tighter">
                                                        {job.organization}
                                                    </span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {formatDistanceToNow(new Date(job.createdAt))} ago
                                                    </span>
                                                </div>
                                                <h2 className="text-xl font-black text-gray-900 group-hover:text-blue-800 transition-colors leading-tight mb-2 uppercase tracking-tight">
                                                    {job.title}
                                                </h2>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {job.hashtags && job.hashtags.slice(0, 3).map((tag, i) => (
                                                        <span key={i} className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-100 group-hover:bg-white transition-colors">
                                                            #{tag.replace(/#/g, '')}
                                                        </span>
                                                    ))}
                                                    {job.hashtags && job.hashtags.length > 3 && (
                                                        <span className="text-[9px] text-gray-400 font-bold my-auto ml-1">
                                                            +{job.hashtags.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex items-center md:flex-col gap-3 md:gap-1 text-right">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 md:block hidden">Location</div>
                                                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                    {job.location || 'Remote'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
