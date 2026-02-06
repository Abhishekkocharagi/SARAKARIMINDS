'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface JobUpdate {
    _id: string;
    title: string;
    organization: string;
    hashtags: string[];
    createdAt: string;
}

export default function AdminJobUpdatesPage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<JobUpdate[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

    // Editing State
    const [editingJobId, setEditingJobId] = useState<string | null>(null);

    // Form States
    const [title, setTitle] = useState('');
    const [organization, setOrganization] = useState('');
    const [description, setDescription] = useState('');
    const [eligibility, setEligibility] = useState('');
    const [location, setLocation] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [applicationLink, setApplicationLink] = useState('');
    const [notificationType, setNotificationType] = useState('matching');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/job-updates', {
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(data);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setFetchLoading(false);
        }
    };

    const handleEdit = (job: JobUpdate) => {
        setEditingJobId(job._id);
        setTitle(job.title);
        setOrganization(job.organization);

        // Since we need description and other details not in the brief list, 
        // we might want to fetch the full details or assume they are there if we change the fetch.
        // For now, let's look at the JobUpdate interface again.
        // It seems the list fetch at /api/admin/job-updates returns the full objects.
        // Let's verify what JobUpdate interface has.
        // I'll update the interface first.

        const fullJob = job as any; // Temporary cast to access missing fields
        setDescription(fullJob.description || '');
        setEligibility(fullJob.eligibility || '');
        setLocation(fullJob.location || '');
        setHashtags(fullJob.hashtags?.join(', ') || '');
        setApplicationLink(fullJob.applicationLink || '');
        setNotificationType(fullJob.notificationType || 'matching');

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingJobId(null);
        setTitle('');
        setOrganization('');
        setDescription('');
        setEligibility('');
        setLocation('');
        setHashtags('');
        setApplicationLink('');
        setNotificationType('matching');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const url = editingJobId
            ? `http://localhost:5000/api/admin/job-updates/${editingJobId}`
            : 'http://localhost:5000/api/admin/job-updates';

        const method = editingJobId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({
                    title,
                    organization,
                    description,
                    eligibility,
                    location,
                    hashtags,
                    applicationLink,
                    notificationType
                })
            });

            if (res.ok) {
                alert(editingJobId ? 'Job update updated successfully' : 'Job update published successfully');
                cancelEdit();
                fetchJobs(); // Refresh list
            } else {
                const data = await res.json();
                alert(data.message || 'Action failed');
            }
        } catch (error) {
            console.error('Error saving job:', error);
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this job?')) {
            try {
                const res = await fetch(`http://localhost:5000/api/admin/job-updates/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${user?.token}`
                    }
                });
                if (res.ok) {
                    alert('Job deleted successfully');
                    fetchJobs();
                } else {
                    alert('Failed to delete job');
                }
            } catch (error) {
                console.error('Error deleting job:', error);
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Job Updates – Admin</h1>
                    <p className="text-gray-500 mt-1">Post new job openings and notifications.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                        {editingJobId ? 'Edit Job Update' : 'Publish New Job Update'}
                    </h2>
                    {editingJobId && (
                        <button
                            onClick={cancelEdit}
                            className="text-xs font-bold text-red-500 uppercase tracking-widest hover:underline"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Job Title *</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition font-bold text-gray-800"
                                placeholder="e.g. First Division Assistant (FDA)"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Organization / Department *</label>
                            <input
                                type="text"
                                required
                                value={organization}
                                onChange={(e) => setOrganization(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition font-bold text-gray-800"
                                placeholder="e.g. KPSC"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Job Description *</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition font-medium text-gray-700 h-32 resize-none"
                            placeholder="Detailed description of the job role..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Eligibility Criteria</label>
                            <textarea
                                value={eligibility}
                                onChange={(e) => setEligibility(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition font-medium text-gray-700 h-24 resize-none"
                                placeholder="e.g. Any Degree, 21-35 years..."
                            />
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition font-bold text-gray-800"
                                    placeholder="e.g. Karnataka / Bangalore"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Exam Hashtags</label>
                                <input
                                    type="text"
                                    value={hashtags}
                                    onChange={(e) => setHashtags(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition font-bold text-gray-800"
                                    placeholder="e.g. KPSC, FDA, SDA"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 ml-1">Comma separated values</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Application Link (Optional)</label>
                        <input
                            type="url"
                            value={applicationLink}
                            onChange={(e) => setApplicationLink(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition font-bold text-gray-800"
                            placeholder="e.g. https://kpsc.kar.nic.in/apply"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Notification Scope</label>
                        <div className="flex gap-6 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="notificationType"
                                    value="matching"
                                    checked={notificationType === 'matching'}
                                    onChange={(e) => setNotificationType(e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-bold text-gray-700">Notify matching users only (Recommended)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="notificationType"
                                    value="all"
                                    checked={notificationType === 'all'}
                                    onChange={(e) => setNotificationType(e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-bold text-gray-700">Notify ALL users</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition shadow-lg shadow-blue-500/30 disabled:opacity-50"
                        >
                            {loading ? (editingJobId ? 'Updating...' : 'Publishing...') : (editingJobId ? 'Update Job' : 'Publish Job')}
                        </button>
                        {editingJobId && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Job List */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-black text-gray-900 mb-6">Recent Job Posts</h2>
                {fetchLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading jobs...</div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 font-bold">No jobs posted yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Job Title</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Organization</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Hashtags</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {jobs.map((job) => (
                                    <tr key={job._id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 font-bold text-gray-800">{job.title}</td>
                                        <td className="p-4 font-medium text-gray-600">{job.organization}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {job.hashtags.slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold uppercase">{tag}</span>
                                                ))}
                                                {job.hashtags.length > 3 && (
                                                    <span className="text-[10px] text-gray-400 my-auto">+{job.hashtags.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 font-medium">
                                            {new Date(job.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(job)}
                                                    className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition"
                                                    title="Edit Job"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(job._id)}
                                                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition"
                                                    title="Delete Job"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
