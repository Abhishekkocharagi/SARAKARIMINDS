'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface Ad {
    _id: string;
    title: string;
    description: string;
    imageUrl: string;
    redirectUrl: string;
    slot: string;
}

interface AdCardProps {
    ad: Ad;
    variant: 'feed' | 'sidebar';
}

const AdCard: React.FC<AdCardProps> = ({ ad, variant }) => {
    const { t } = useLanguage();
    if (!ad) return null;

    if (variant === 'sidebar') {
        return (
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm mt-4 group">
                <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('ad.sponsored')}</span>
                    <span className="text-[10px] font-bold text-blue-600 group-hover:underline cursor-pointer">{t('ad.sponsored')}</span>
                </div>
                <div className="p-4">
                    <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="w-full h-32 object-cover rounded-lg mb-3 shadow-inner"
                    />
                    <h5 className="font-black text-sm text-gray-900 leading-tight uppercase tracking-tight">{ad.title}</h5>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 font-medium">
                        {ad.description}
                    </p>
                    <a
                        href={ad.redirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block w-full text-center py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                    >
                        {t('ad.learn_more')}
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="px-5 py-3 border-b flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{t('ad.promoted')}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div className="p-6">
                <div className="flex gap-6 items-start">
                    <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="w-32 h-32 object-cover rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="flex-1 space-y-2">
                        <h4 className="font-black text-xl text-gray-900 uppercase tracking-tight leading-none">{ad.title}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed font-medium">
                            {ad.description}
                        </p>
                        <div className="pt-2">
                            <a
                                href={ad.redirectUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-8 py-3 bg-blue-700 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                            >
                                {t('ad.visit_website')}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdCard;
