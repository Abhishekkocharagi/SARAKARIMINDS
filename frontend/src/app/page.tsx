'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiUsers, FiShare2, FiBell, FiAward, FiArrowRight, FiCheckCircle, FiSearch, FiMessageSquare, FiActivity } from 'react-icons/fi';

export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/feed');
        }
    }, [user, loading, router]);

    if (loading || user) {
        return (
            <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-5xl font-black text-[#1a237e] uppercase tracking-tighter mb-4 animate-pulse">SarkariMinds</h1>
                    <div className="w-16 h-1 w-full bg-blue-100 rounded-full overflow-hidden">
                        <div className="w-1/2 h-full bg-[#1a237e] animate-[loading_1.5s_infinite]"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F2EF] font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-2 md:gap-3 group cursor-pointer transition-all duration-300">
                        <div className="w-10 h-10 bg-[#1a237e] rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg">S</div>
                        <span className="text-xl md:text-2xl font-black text-[#1a237e] tracking-tighter uppercase italic">SarkariMinds</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-8">
                        <div className="flex items-center gap-1.5 text-gray-400 group cursor-pointer">
                            <FiSearch className="group-hover:text-[#1a237e]" />
                            <span className="text-xs font-bold uppercase tracking-widest group-hover:text-[#1a237e]">Discover</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 group cursor-pointer">
                            <FiUsers className="group-hover:text-[#1a237e]" />
                            <span className="text-xs font-bold uppercase tracking-widest group-hover:text-[#1a237e]">Network</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 group cursor-pointer">
                            <FiActivity className="group-hover:text-[#1a237e]" />
                            <span className="text-xs font-bold uppercase tracking-widest group-hover:text-[#1a237e]">Feed</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        <Link href="/login" className="text-xs font-black text-gray-500 hover:text-[#1a237e] transition-colors uppercase tracking-widest">Sign In</Link>
                        <Link href="/signup" className="bg-[#1a237e] text-white px-5 md:px-8 py-2 md:py-3 rounded-lg font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95">Join Now</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-24 lg:pt-40 pb-20 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8 animate-in slide-in-from-left duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-md">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a237e]">The Professional Network for Aspirants</span>
                        </div>

                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 leading-[0.9] tracking-tighter">
                            Connect. Share.<br />
                            <span className="text-[#1a237e]">Succeed.</span>
                        </h1>

                        <p className="text-xl text-gray-600 font-medium max-w-lg leading-relaxed">
                            Welcome to the <span className="text-[#1a237e] font-black">LinkedIn of Government Exams</span>. Build your professional identity, share your preparation journey, and connect with Karnataka's elite aspirant community.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link href="/signup" className="px-10 py-5 bg-[#1a237e] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-3 group">
                                Start Your Journey
                                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/login" className="px-10 py-5 bg-white text-[#1a237e] border-2 border-[#1a237e] rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all">
                                Aspirant Login
                            </Link>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/150?u=asp_${i}`} alt="user" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Join 15K+ Future Officers</p>
                        </div>
                    </div>

                    <div className="relative animate-in zoom-in duration-1000">
                        {/* Feed Mockup Aesthetic */}
                        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 transform rotate-2 hover:rotate-0 transition-all duration-700">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aspirant Network Feed</span>
                            </div>
                            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80" alt="Networking Interface" className="w-full h-auto grayscale-[0.2] hover:grayscale-0 transition-all" />
                        </div>

                        {/* Status Bubbles */}
                        <div className="absolute -top-10 -right-4 bg-blue-700 text-white p-6 rounded-3xl shadow-2xl animate-bounce duration-[5000ms]">
                            <FiUsers className="mb-2" size={24} />
                            <p className="text-[10px] font-black uppercase">Connections</p>
                            <p className="text-xl font-black">2.4K+</p>
                        </div>
                        <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-xl border border-gray-50 transform -rotate-6 animate-pulse">
                            <FiShare2 className="text-blue-600 mb-2" size={24} />
                            <p className="text-[10px] font-black uppercase text-gray-400">Posts Shared</p>
                            <p className="text-xl font-black text-gray-900">50K+</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Social Proof Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em]">Networking Redefined</h2>
                        <h3 className="text-4xl font-black text-gray-900 tracking-tighter">Everything you need in your <span className="text-[#1a237e]">Preparation Journey.</span></h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="space-y-6 p-8 rounded-[2rem] bg-gray-50 hover:bg-blue-50/50 transition-colors border border-transparent hover:border-blue-100">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#1a237e] shadow-sm"><FiUsers size={28} /></div>
                            <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">Expand Your Network</h4>
                            <p className="text-sm font-medium text-gray-500 leading-relaxed">Connect with fellow aspirants preparing for KPSC, PSI, and FDA. Build meaningful study circles and share insights.</p>
                        </div>
                        <div className="space-y-6 p-8 rounded-[2rem] bg-gray-50 hover:bg-blue-50/50 transition-colors border border-transparent hover:border-blue-100">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#1a237e] shadow-sm"><FiShare2 size={28} /></div>
                            <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">Document Your Journey</h4>
                            <p className="text-sm font-medium text-gray-500 leading-relaxed">Share your progress, study notes, and daily wins. Inspire others while tracking your own path to the selection list.</p>
                        </div>
                        <div className="space-y-6 p-8 rounded-[2rem] bg-gray-50 hover:bg-blue-50/50 transition-colors border border-transparent hover:border-blue-100">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#1a237e] shadow-sm"><FiAward size={28} /></div>
                            <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">Learn from the Best</h4>
                            <p className="text-sm font-medium text-gray-500 leading-relaxed">Follow verified rank holders and mentors. Get direct access to strategies that actually work for Karnataka exams.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* LinkedIn-style Value Props */}
            <section className="py-24 bg-[#F3F2EF]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-20">
                        <div className="flex-1 space-y-8">
                            <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">
                                Build your <br /> <span className="text-[#1a237e]">Professional Identity</span> <br /> as an Aspirant.
                            </h2>
                            <ul className="space-y-6">
                                <li className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mt-1 flex-shrink-0">✓</div>
                                    <div>
                                        <p className="font-black text-gray-900 uppercase text-xs tracking-widest">Comprehensive Profile</p>
                                        <p className="text-sm text-gray-500 mt-1">Showcase your targeted exams, bio, and preparation status.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mt-1 flex-shrink-0">✓</div>
                                    <div>
                                        <p className="font-black text-gray-900 uppercase text-xs tracking-widest">Real-time Feed</p>
                                        <p className="text-sm text-gray-500 mt-1">Stay updated with the latest exam news, tips, and peer updates.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mt-1 flex-shrink-0">✓</div>
                                    <div>
                                        <p className="font-black text-gray-900 uppercase text-xs tracking-widest">Private Messaging</p>
                                        <p className="text-sm text-gray-500 mt-1">Chat securely with connections and mentors to solve doubts.</p>
                                    </div>
                                </li>
                            </ul>
                            <div className="pt-4">
                                <Link href="/signup" className="px-8 py-4 bg-[#1a237e] text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-all">Join the Network</Link>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <div className="bg-white p-8 rounded-[3rem] shadow-2xl space-y-8">
                                <div className="flex items-center gap-4 border-b border-gray-100 pb-8">
                                    <div className="w-16 h-16 rounded-full bg-blue-100 overflow-hidden shadow-inner">
                                        <img src="https://i.pravatar.cc/150?u=current" alt="avatar" />
                                    </div>
                                    <div>
                                        <p className="font-black text-lg text-gray-900 uppercase tracking-tight">Kiran Kumar</p>
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">KPSC KAS Aspirant</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-4 bg-gray-50 rounded-full w-3/4"></div>
                                    <div className="h-4 bg-gray-50 rounded-full w-full"></div>
                                    <div className="h-4 bg-gray-50 rounded-full w-1/2"></div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <div className="flex-1 h-12 bg-[#1a237e] rounded-xl flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest">Pending: 12 Requests</div>
                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-blue-600 group hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"><FiMessageSquare /></div>
                                </div>
                            </div>
                            <div className="absolute -top-6 -left-6 bg-yellow-400 p-4 rounded-2xl shadow-xl transform -rotate-3">
                                <p className="font-black text-[10px] uppercase tracking-tighter">Verified User</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto bg-white rounded-[4rem] p-12 lg:p-20 text-center shadow-xl border border-gray-100">
                    <h2 className="text-5xl font-black text-gray-900 tracking-tighter mb-8 italic">Ready to explore your <br /> <span className="text-[#1a237e]">journey with us?</span></h2>
                    <p className="text-gray-500 font-medium text-lg mb-10">Don't prepare in isolation. Join 15,000+ others who are building their future together on Karnataka's first professional aspirant network.</p>
                    <Link href="/signup" className="px-16 py-6 bg-[#1a237e] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-4 group mx-auto w-fit">
                        Create Your Professional Profile
                        <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-10">
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-[#1a237e] rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg">S</div>
                        <span className="text-3xl font-black text-[#1a237e] tracking-tighter uppercase italic">SarkariMinds</span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Connecting the Future Officers of Karnataka</p>
                    <div className="flex justify-center gap-12 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        <Link href="/privacy" className="hover:text-[#1a237e]">Privacy</Link>
                        <Link href="/terms" className="hover:text-[#1a237e]">Terms</Link>
                        <Link href="/about" className="hover:text-[#1a237e]">Our Story</Link>
                        <Link href="/contact" className="hover:text-[#1a237e]">Contact</Link>
                    </div>
                    <p className="text-[8px] font-bold text-gray-300 uppercase">© 2026 SarkariMinds Team. All rights reserved.</p>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    );
}
