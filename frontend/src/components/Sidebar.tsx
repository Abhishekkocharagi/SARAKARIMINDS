'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
    FiFileText,
    FiBook,
    FiBriefcase,
    FiUsers,
    FiMessageSquare,
    FiBell,
    FiUser,
    FiSettings,
    FiGlobe,
    FiStar,
    FiMaximize
} from 'react-icons/fi';

export default function Sidebar() {
    const { user } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const pathname = usePathname();

    const MenuItem = ({ href, icon: Icon, title, id, badge }: { href: string, icon: any, title: string, id?: string, badge?: string }) => {
        const isActive = id ? (pathname === href && pathname.includes(id)) : (pathname === href);

        return (
            <Link href={href} className="block w-full group">
                <div className={`
                    relative flex items-center gap-3 h-12 px-4 rounded-2xl transition-all duration-300
                    bg-white border shadow-sm
                    ${isActive
                        ? 'border-blue-600 shadow-blue-100 scale-[1.01]'
                        : 'border-gray-100 hover:border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.01]'
                    }
                `}>
                    {/* Icon Container */}
                    <div className={`
                        w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300
                        ${isActive
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-100 group-hover:to-indigo-100'
                        }
                    `}>
                        <Icon size={20} className={`${isActive ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'} transition-colors stroke-[2.5px]`} />
                    </div>

                    {/* Title */}
                    <span className={`
                        text-sm font-bold truncate flex-1 leading-none tracking-tight
                        ${isActive ? 'text-blue-700' : 'text-gray-800 group-hover:text-blue-700'}
                    `}>
                        {title}
                    </span>

                    {/* Badge */}
                    {badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm">
                            {badge}
                        </span>
                    )}

                    {/* Active Indicator Dot */}
                    {isActive && (
                        <div className="w-2 h-2 rounded-full bg-blue-600 shadow-lg shadow-blue-600/50 animate-pulse" />
                    )}

                    {/* Hover Glow Effect */}
                    {!isActive && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-indigo-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                </div>
            </Link>
        );
    };

    return (
        <aside className="w-full flex flex-col pt-2 pb-6 px-3">
            {/* Main Navigation */}
            <nav className="flex-1 space-y-2">
                <MenuItem
                    href="/daily-newspaper"
                    icon={FiFileText}
                    title={t('sidebar.daily_newspaper')}
                />

                <MenuItem
                    href="/exams"
                    icon={FiBook}
                    title={t('sidebar.exam_hub')}
                />

                <MenuItem
                    href="/job-updates"
                    icon={FiBriefcase}
                    title={t('sidebar.job_updates')}
                />

                <MenuItem
                    href="/games"
                    icon={FiMaximize}
                    title={t('sidebar.games')}
                />

                <MenuItem
                    href="/quiz"
                    icon={FiStar}
                    title={t('sidebar.quiz')}
                />

                <MenuItem
                    href="/current-affairs"
                    icon={FiGlobe}
                    title={t('sidebar.current_affairs')}
                />
            </nav>

            {/* Divider */}
            <div className="my-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {/* Language Switcher - Enhanced Design */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 p-4 border border-gray-100 shadow-sm">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-500 rounded-full blur-2xl" />
                </div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <FiGlobe size={16} className="text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-gray-700">
                            {t('sidebar.language')}
                        </span>
                    </div>

                    {/* Language Toggle */}
                    <div className="relative flex items-center bg-white/80 backdrop-blur-sm p-1 rounded-xl border border-gray-200/50 shadow-inner">
                        {/* Sliding Background */}
                        <div
                            className={`
                                absolute top-1 h-[calc(100%-8px)] w-[calc(33.33%-4px)] 
                                bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg 
                                shadow-lg shadow-blue-600/30 transition-all duration-300 ease-out
                                ${language === 'en' ? 'left-1' : language === 'kn' ? 'left-[calc(33.33%+1px)]' : 'left-[calc(66.66%+1px)]'}
                            `}
                        />

                        <button
                            onClick={() => setLanguage('en')}
                            className={`
                                relative z-10 flex-1 px-2 py-2 text-[10px] font-black rounded-lg 
                                transition-all duration-300
                                ${language === 'en'
                                    ? 'text-white scale-105'
                                    : 'text-gray-500 hover:text-gray-700'
                                }
                            `}
                        >
                            English
                        </button>

                        <button
                            onClick={() => setLanguage('kn')}
                            className={`
                                relative z-10 flex-1 px-2 py-2 text-[10px] font-black rounded-lg 
                                transition-all duration-300
                                ${language === 'kn'
                                    ? 'text-white scale-105'
                                    : 'text-gray-500 hover:text-gray-700'
                                }
                            `}
                        >
                            ಕನ್ನಡ
                        </button>

                        <button
                            onClick={() => setLanguage('hi')}
                            className={`
                                relative z-10 flex-1 px-2 py-2 text-[10px] font-black rounded-lg 
                                transition-all duration-300
                                ${language === 'hi'
                                    ? 'text-white scale-105'
                                    : 'text-gray-500 hover:text-gray-700'
                                }
                            `}
                        >
                            हिंदी
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Accent */}
            <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{t('sidebar.online')}</span>
                </div>
            </div>


        </aside>
    );
}
