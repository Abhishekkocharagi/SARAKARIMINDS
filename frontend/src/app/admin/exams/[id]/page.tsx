'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';

interface Exam {
    _id: string;
    name: string;
    fullName: string;
    conductingBody: string;
    logoUrl?: string;
    examLevel: string;
    category: string;
    language: string;
    examType: string;
    status: string;
    overview: string;
    jobRole: string;
    postingDepartments: string;
    careerGrowth: string;
    salaryScale: string;
    eligibilityDetails: string;
    examPattern: string;
    officialPartnerAcademy: any;
    partnerAcademyLogo: string;
}

export default function AdminExamDetailsPage() {
    const { user } = useAuth();
    const { id } = useParams();
    const router = useRouter();

    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('master');

    // Form states
    const [formData, setFormData] = useState<Partial<Exam>>({});

    // Job Update states
    const [updateTitle, setUpdateTitle] = useState('');
    const [updateType, setUpdateType] = useState('Vacancy');
    const [updateDesc, setUpdateDesc] = useState('');

    // Doc states
    const [docTitle, setDocTitle] = useState('');
    const [docCategory, setDocCategory] = useState('Notification');
    const [docFile, setDocFile] = useState<File | null>(null);
    const [examDocuments, setExamDocuments] = useState<any[]>([]);

    // Branding states
    const [verifiedAcademies, setVerifiedAcademies] = useState<any[]>([]);
    const [partnerLogoFile, setPartnerLogoFile] = useState<File | null>(null);
    const [examLogoFile, setExamLogoFile] = useState<File | null>(null);



    const fetchVerifiedAcademies = React.useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/exams/academies/verified', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) setVerifiedAcademies(await res.json());
        } catch (err) { console.error(err); }
    }, [user]);



    const fetchDocuments = React.useCallback(async (examName: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/exams/${examName}`);
            if (res.ok) {
                const data = await res.json();
                setExamDocuments(data.documents || []);
            }
        } catch (err) {
            console.error('Error fetching docs:', err);
        }
    }, []);

    const fetchExamDetails = React.useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/exams`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const found = data.find((e: any) => e._id === id);
                if (found) {
                    setExam(found);
                    setFormData(found);
                    // Fetch existing documents
                    fetchDocuments(found.name);
                }
            }
        } catch (error) {
            console.error('Error fetching exam:', error);
        } finally {
            setLoading(false);
        }
    }, [user, id, fetchDocuments]);

    const handleSaveMaster = async () => {
        setSaving(true);
        try {
            const res = await fetch(`http://localhost:5000/api/admin/exams/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert('Exam updated successfully');
                fetchExamDetails();
            }
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (user?.token) {
            fetchExamDetails();
            fetchVerifiedAcademies();
        }
    }, [id, user, fetchExamDetails, fetchVerifiedAcademies]);

    const handleAddUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/admin/exams/updates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({
                    examId: id,
                    type: updateType,
                    title: updateTitle,
                    description: updateDesc,
                    examTag: exam?.name
                })
            });
            if (res.ok) {
                alert('Update published and notifications sent!');
                setUpdateTitle('');
                setUpdateDesc('');
            }
        } catch (error) {
            console.error('Error adding update:', error);
        }
    };

    const handleUploadDoc = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!docFile) return alert('Select a file');

        setSaving(true);
        const fData = new FormData();
        fData.append('examId', id as string);
        fData.append('title', docTitle);
        fData.append('category', docCategory);
        fData.append('examTag', exam?.name || '');
        fData.append('file', docFile);

        try {
            const res = await fetch('http://localhost:5000/api/admin/exams/documents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                },
                body: fData
            });
            if (res.ok) {
                alert('Document uploaded successfully!');
                setDocTitle('');
                setDocFile(null);
                setDocTitle('');
                setDocFile(null);
                if (exam?.name) fetchDocuments(exam.name);
            }
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center font-bold">Loading...</div>;
    if (!exam) return <div className="p-8 text-center text-red-500 font-bold">Exam not found</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <button onClick={() => router.back()} className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2 hover:underline">← Back to Exams</button>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{exam.name} Management</h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                {['master', 'branding', 'content', 'updates', 'documents', 'analytics'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 min-h-[500px]">
                {activeTab === 'master' && (
                    <div className="space-y-6 max-w-4xl">
                        <h2 className="text-xl font-black text-gray-900 mb-4">Master Details</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName || ''}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-600 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Conducting Body</label>
                                <input
                                    type="text"
                                    value={formData.conductingBody || ''}
                                    onChange={(e) => setFormData({ ...formData, conductingBody: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-600 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Exam Level</label>
                                <input
                                    type="text"
                                    value={formData.examLevel || ''}
                                    onChange={(e) => setFormData({ ...formData, examLevel: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-600 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                                <input
                                    type="text"
                                    value={formData.category || ''}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-600 outline-none"
                                />
                            </div>
                        </div>

                        {/* Exam Logo Upload */}
                        <div className="bg-gray-50 border border-gray-100 p-6 rounded-xl">
                            <h3 className="text-sm font-black text-gray-900 mb-4">Official Exam Logo</h3>
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 bg-white border-2 border-dashed rounded-full flex items-center justify-center overflow-hidden shadow-sm relative">
                                    {examLogoFile ? (
                                        <img src={URL.createObjectURL(examLogoFile)} className="w-full h-full object-cover" alt="Preview" />
                                    ) : formData.logoUrl ? (
                                        <img src={formData.logoUrl} className="w-full h-full object-cover" alt="Official Logo" />
                                    ) : (
                                        <span className="text-4xl grayscale">🏛️</span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Upload New Logo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setExamLogoFile(e.target.files?.[0] || null)}
                                        className="text-xs font-bold text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 font-bold">Recommended: Square PNG/JPG, transparent background.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={async () => {
                                setSaving(true);
                                try {
                                    let logoUrl = formData.logoUrl;

                                    if (examLogoFile) {
                                        const uploadData = new FormData();
                                        uploadData.append('file', examLogoFile);
                                        const uploadRes = await fetch('http://localhost:5000/api/admin/exams/upload-image', {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${user?.token}` },
                                            body: uploadData
                                        });
                                        if (uploadRes.ok) {
                                            const upData = await uploadRes.json();
                                            logoUrl = upData.fileUrl;
                                        }
                                    }

                                    const res = await fetch(`http://localhost:5000/api/admin/exams/${id}`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${user?.token}`
                                        },
                                        body: JSON.stringify({ ...formData, logoUrl })
                                    });
                                    if (res.ok) {
                                        alert('Exam updated successfully');
                                        fetchExamDetails();
                                    }
                                } catch (error) {
                                    console.error('Error saving:', error);
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            disabled={saving}
                            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Master Details'}
                        </button>
                    </div>
                )}

                {activeTab === 'branding' && (
                    <div className="space-y-8 max-w-4xl">
                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-2">Academy Branding</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Select the exclusive partner for this exam</p>

                            <div className="space-y-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Official Academy Partner</label>
                                    <select
                                        value={formData.officialPartnerAcademy?._id || formData.officialPartnerAcademy || ''}
                                        onChange={(e) => setFormData({ ...formData, officialPartnerAcademy: e.target.value })}
                                        className="w-full bg-white border border-gray-200 p-4 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-600"
                                    >
                                        <option value="">No Partner Academy</option>
                                        {verifiedAcademies.map((ac) => (
                                            <option key={ac._id} value={ac._id}>{ac.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Academy Partner Logo (Small Branding)</label>
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-white border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden">
                                            {partnerLogoFile ? (
                                                <img src={URL.createObjectURL(partnerLogoFile)} className="w-full h-full object-contain" alt="Preview" />
                                            ) : formData.partnerAcademyLogo ? (
                                                <img src={formData.partnerAcademyLogo} className="w-full h-full object-contain" alt="Partner Logo" />
                                            ) : (
                                                <span className="text-2xl opacity-20">🖼️</span>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setPartnerLogoFile(e.target.files?.[0] || null)}
                                            className="text-xs font-bold text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <button
                            onClick={async () => {
                                setSaving(true);
                                try {
                                    let logoUrl = formData.partnerAcademyLogo;
                                    if (partnerLogoFile) {
                                        const uploadData = new FormData();
                                        uploadData.append('file', partnerLogoFile);
                                        const uploadRes = await fetch('http://localhost:5000/api/admin/exams/upload-image', {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${user?.token}` },
                                            body: uploadData
                                        });
                                        if (uploadRes.ok) {
                                            const upData = await uploadRes.json();
                                            logoUrl = upData.fileUrl;
                                        }
                                    }
                                    const res = await fetch(`http://localhost:5000/api/admin/exams/${id}`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${user?.token}`
                                        },
                                        body: JSON.stringify({
                                            ...formData,
                                            officialPartnerAcademy: formData.officialPartnerAcademy === "" ? null : (formData.officialPartnerAcademy?._id || formData.officialPartnerAcademy),
                                            partnerAcademyLogo: logoUrl
                                        })
                                    });
                                    if (res.ok) {
                                        alert('Branding updated successfully');
                                        fetchExamDetails();
                                    }
                                } catch (err) { console.error(err); } finally { setSaving(false); }
                            }}
                            disabled={saving}
                            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Branding'}
                        </button>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-6 max-w-4xl">
                        <h2 className="text-xl font-black text-gray-900 mb-4">Content Management</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Overview (What is this exam?)</label>
                                <textarea
                                    value={formData.overview || ''}
                                    onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-medium text-gray-700 h-32 outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Syllabus Details</label>
                                <textarea
                                    value={formData.examPattern || ''}
                                    onChange={(e) => setFormData({ ...formData, examPattern: e.target.value })}
                                    placeholder="Brief pattern or rich text content..."
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-medium text-gray-700 h-32 outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSaveMaster}
                            disabled={saving}
                            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Content'}
                        </button>
                    </div>
                )}

                {activeTab === 'updates' && (
                    <div className="space-y-6 max-w-4xl">
                        <h2 className="text-xl font-black text-gray-900 mb-4">Publish Job Updates</h2>
                        <form onSubmit={handleAddUpdate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Update Type</label>
                                    <select
                                        value={updateType}
                                        onChange={(e) => setUpdateType(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold text-gray-800 outline-none"
                                    >
                                        <option value="Vacancy">Vacancy</option>
                                        <option value="Admit Card">Admit Card</option>
                                        <option value="Result">Result</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                                    <input
                                        type="text"
                                        value={updateTitle}
                                        onChange={(e) => setUpdateTitle(e.target.value)}
                                        required
                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold text-gray-800 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                                <textarea
                                    value={updateDesc}
                                    onChange={(e) => setUpdateDesc(e.target.value)}
                                    required
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-medium text-gray-700 h-24 outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                            >
                                Publish & Notify Aspirants
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-6 max-w-4xl">
                        <h2 className="text-xl font-black text-gray-900 mb-4">Official Documents Hub</h2>
                        <form onSubmit={handleUploadDoc} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Document Title</label>
                                    <input
                                        type="text"
                                        value={docTitle}
                                        onChange={(e) => setDocTitle(e.target.value)}
                                        required
                                        className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                                    <select
                                        value={docCategory}
                                        onChange={(e) => setDocCategory(e.target.value)}
                                        className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold outline-none"
                                    >
                                        <option value="Notification">Notification</option>
                                        <option value="Syllabus">Syllabus</option>
                                        <option value="Previous Paper">Previous Paper</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Select PDF File</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                                    required
                                    className="w-full text-xs font-bold text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition disabled:opacity-50"
                            >
                                {saving ? 'Uploading...' : 'Upload Document'}
                            </button>
                        </form>

                        <div className="pt-8">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Existing Documents</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {examDocuments.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No documents uploaded yet.</p>
                                ) : (
                                    examDocuments.map((doc) => (
                                        <div key={doc._id} className="p-4 border border-gray-100 rounded-xl flex items-center justify-between hover:bg-gray-50 transition">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">📄</span>
                                                <div>
                                                    <p className="text-xs font-black text-gray-900">{doc.title}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{doc.category}</p>
                                                </div>
                                            </div>
                                            <a href={doc.fileUrl} target="_blank" className="text-[10px] font-black text-blue-600 uppercase hover:underline">View PDF →</a>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-black text-gray-900 mb-4">Exam Analytics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Aspirants</p>
                                <h3 className="text-3xl font-black text-blue-600">0</h3>
                            </div>
                            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Active Users</p>
                                <h3 className="text-3xl font-black text-purple-600">0</h3>
                            </div>
                            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Notif. Reach</p>
                                <h3 className="text-3xl font-black text-orange-600">0%</h3>
                            </div>
                            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Community Engagement</p>
                                <h3 className="text-3xl font-black text-green-600">Low</h3>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 font-bold italic mt-4">* Data refreshes every 24 hours.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
