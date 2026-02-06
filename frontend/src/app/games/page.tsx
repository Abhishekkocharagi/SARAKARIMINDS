'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { FiStar, FiGrid, FiArrowRight, FiMap, FiArrowLeft } from 'react-icons/fi';

export default function GamesHubPage() {
    const { t } = useLanguage();

    const gameOptions = [
        {
            id: 'jilebi',
            title: t('jilebi.title'),
            subtitle: t('jilebi.subtitle'),
            icon: FiStar,
            href: '/jilebi-puzzles',
            color: 'from-amber-400 to-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            iconColor: 'text-amber-600'
        },
        {
            id: 'word-path',
            title: t('games.word_path_title'),
            subtitle: t('games.word_path_desc'),
            icon: FiMap,
            href: '/word-path',
            color: 'from-emerald-400 to-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            iconColor: 'text-emerald-600',
            disabled: false
        }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20 px-4">
            <header className="bg-white p-8 md:p-12 rounded-[3.5rem] border shadow-sm text-center space-y-4">
                <div className="flex justify-center w-full mb-4">
                    <Link href="/feed" className="inline-flex items-center gap-2 text-gray-400 font-bold hover:bg-gray-50 px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-colors border border-transparent hover:border-gray-100">
                        <FiArrowLeft /> {t('games.back_home')}
                    </Link>
                </div>
                <div className="inline-block px-4 py-1 bg-amber-50 rounded-full text-[10px] font-black text-amber-600 uppercase tracking-widest border border-amber-100 mb-2">
                    {t('games.ent_learning')}
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
                    {t('sidebar.games')}
                </h1>
                <p className="text-gray-500 font-medium max-w-xl mx-auto">
                    {t('games.subtitle')}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {gameOptions.map((game) => (
                    <Link
                        key={game.id}
                        href={game.href}
                        className={`group relative block overflow-hidden rounded-[3rem] border ${game.border} ${game.bg} transition-all ${!game.disabled ? 'hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]' : 'opacity-80 grayscale'}`}
                    >
                        <div className="p-10 space-y-6">
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${game.bg} shadow-soft border ${game.border} group-hover:scale-110 transition-transform duration-500`}>
                                <game.icon className={`w-8 h-8 ${game.iconColor}`} />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-gray-900 group-hover:text-amber-600 transition-colors uppercase tracking-tight">
                                    {game.title}
                                </h2>
                                <p className="text-sm font-bold text-gray-400 leading-relaxed">
                                    {game.subtitle}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${game.disabled ? 'text-gray-400' : 'text-amber-600'}`}>
                                    {game.disabled ? t('games.coming_soon') : t('games.play_now')}
                                </span>
                                {!game.disabled && (
                                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-lg group-hover:translate-x-2 transition-transform">
                                        <FiArrowRight />
                                    </div>
                                )}
                            </div>
                        </div>

                        {!game.disabled && (
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity blur-3xl -z-10`} />
                        )}
                    </Link>
                ))}
            </div>

            <div className="bg-amber-900 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 space-y-6">
                    <div className="inline-block px-4 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                        {t('games.did_you_know')}
                    </div>
                    <h3 className="text-3xl font-black leading-tight max-w-lg">
                        {t('games.fun_fact')}
                    </h3>
                    <p className="text-amber-200 font-bold text-sm max-w-sm">
                        {t('games.fun_desc')}
                    </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
